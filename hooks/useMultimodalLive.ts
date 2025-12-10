import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToUint8Array, decodeAudioData, pcmToGeminiBlob, arrayBufferToBase64 } from '../utils/audioUtils';

// Configuration constants
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
// Reduced buffer size for lower latency (2048 ~= 128ms at 16kHz)
const BUFFER_SIZE = 2048; 
const NOISE_THRESHOLD = 0.01; // Used for Visualizer only now

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GroundingChunk {
  web?: { uri: string; title: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
}

interface UseMultimodalLiveProps {
  systemInstruction?: string;
  voiceName?: string;
}

export const useMultimodalLive = ({ 
  systemInstruction = "You are Jarvis, a helpful female AI study assistant.", 
  voiceName = "Zephyr" 
}: UseMultimodalLiveProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState<number>(0);
  
  // Real-time transcription state
  const [inProgressInput, setInProgressInput] = useState<string>('');
  const [inProgressOutput, setInProgressOutput] = useState<string>('');

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Scheduling playback
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Transcription & Grounding Buffers
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');
  const currentGroundingChunksRef = useRef<GroundingChunk[]>([]);
  
  // API Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
      outputAudioContextRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });

      analyserRef.current = outputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(outputAudioContextRef.current.destination);

      // Explicitly request Echo Cancellation and Noise Suppression
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: systemInstruction, 
          // Re-enable Search to provide "Sources" as requested
          tools: [{ googleSearch: {} }], 
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      sessionPromiseRef.current = ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            console.log("Gemini Live Connection Opened");
            setConnectionState('connected');
            if (inputAudioContextRef.current?.state === 'suspended') {
              await inputAudioContextRef.current.resume();
            }
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            const processor = inputAudioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate Volume for Visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(100, rms * 1000));

              // CONTINUOUS STREAMING
              const blob = pcmToGeminiBlob(inputData, INPUT_SAMPLE_RATE);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: blob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const outputTx = message.serverContent?.outputTranscription;
            const inputTx = message.serverContent?.inputTranscription;

            if (outputTx?.text) {
              currentOutputTranscriptionRef.current += outputTx.text;
              setInProgressOutput(currentOutputTranscriptionRef.current);
            }
            if (inputTx?.text) {
              currentInputTranscriptionRef.current += inputTx.text;
              setInProgressInput(currentInputTranscriptionRef.current);
            }

            // Extract Grounding Metadata (Sources)
            const serverContent = message.serverContent as any;
            if (serverContent?.groundingMetadata?.groundingChunks) {
                currentGroundingChunksRef.current.push(...serverContent.groundingMetadata.groundingChunks);
            }

            if (message.serverContent?.turnComplete) {
              const timestamp = Date.now();
              const userText = currentInputTranscriptionRef.current.trim();
              const aiText = currentOutputTranscriptionRef.current.trim();
              const groundingChunks = [...currentGroundingChunksRef.current];
              
              if (userText || aiText) {
                  setMessages(prev => {
                      const newMessages = [...prev];
                      if (userText) {
                          newMessages.push({ id: `user-${timestamp}`, role: 'user', text: userText, timestamp });
                      }
                      if (aiText) {
                          newMessages.push({ 
                              id: `ai-${timestamp + 1}`, 
                              role: 'assistant', 
                              text: aiText, 
                              timestamp: timestamp + 1,
                              groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
                          });
                      }
                      return newMessages;
                  });
              }
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
              currentGroundingChunksRef.current = []; // Reset chunks
              setInProgressInput('');
              setInProgressOutput('');
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx, OUTPUT_SAMPLE_RATE);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.addEventListener('ended', () => activeSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              activeSourcesRef.current.add(source);
              nextStartTimeRef.current += audioBuffer.duration;
            }

            if (message.serverContent?.interrupted) {
              console.log("Model interrupted by user audio");
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentOutputTranscriptionRef.current = ''; 
              currentGroundingChunksRef.current = [];
              setInProgressOutput('');
            }
          },
          onclose: (event) => {
            console.log("Gemini Live Connection Closed", event);
            setConnectionState('disconnected');
            cleanupAudio();
          },
          onerror: (err) => {
            console.error("Gemini Live API Error:", err);
            setConnectionState('error');
            cleanupAudio();
          }
        }
      });

    } catch (error) {
      console.error("Connection failed", error);
      setConnectionState('error');
      cleanupAudio();
    }
  }, [systemInstruction, voiceName, cleanupAudio]);

  const disconnect = useCallback(() => {
     if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close()).catch(() => {});
        sessionPromiseRef.current = null;
     }
     cleanupAudio();
     setConnectionState('disconnected');
  }, [cleanupAudio]);

  const sendTextMessage = useCallback((text: string) => {
    if (!sessionPromiseRef.current) return;
    const timestamp = Date.now();
    setMessages(prev => [...prev, { id: `user-${timestamp}`, role: 'user', text: text, timestamp }]);

    sessionPromiseRef.current.then(session => {
        try {
            if (typeof session.send === 'function') {
                session.send({
                    clientContent: {
                        turns: [{ role: 'user', parts: [{ text }] }],
                        turnComplete: true
                    }
                });
            } else {
                console.warn("Live API: session.send is not a function. Cannot send text.");
            }
        } catch (e) {
            console.error("Failed to send text message:", e);
        }
    });
  }, []);

  const sendHiddenMessage = useCallback((text: string) => {
    if (!sessionPromiseRef.current) return;
    sessionPromiseRef.current.then(session => {
        try {
            if (typeof session.send === 'function') {
                session.send({
                    clientContent: {
                        turns: [{ role: 'user', parts: [{ text }] }],
                        turnComplete: true
                    }
                });
            }
        } catch (e) {
            console.error("Failed to send hidden message:", e);
        }
    });
  }, []);

  const sendRealtimeInput = (base64Data: string, mimeType: string) => {
      sessionPromiseRef.current?.then(session => {
          try {
             session.sendRealtimeInput({
                media: {
                    mimeType,
                    data: base64Data
                }
             });
          } catch(e) {
             console.error("Error sending realtime input:", e);
          }
      });
  };

  return {
    connect,
    disconnect,
    connectionState,
    messages,
    inProgressInput,
    inProgressOutput,
    volume,
    sendTextMessage,
    sendHiddenMessage, 
    sendRealtimeInput
  };
};