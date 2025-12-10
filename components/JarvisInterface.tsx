import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Key, Send,
  GraduationCap, Calculator, FlaskConical, ScrollText, Terminal,
  Sparkles, MessageSquare, GripHorizontal, Loader2,
  Upload, ChevronRight, BookOpen, Crown, X, Check, CreditCard, Zap,
  User, LogOut, Shield, FileText, Github, Linkedin, Instagram, Info, Lock, Mail,
  History, Clock, Trash2, Search, Scale, RefreshCcw, Phone
} from 'lucide-react';
import Visualizer from './Visualizer';
import { useMultimodalLive } from '../hooks/useMultimodalLive';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// --- Subject Configuration ---

const BASE_TEACHER_PERSONA = `You are Jarvis, an expert AI Tutor and Study Companion.

**TEACHING PERSONA (THE "COMPLETE CLASSROOM TEACHER"):**
1.  **FULL LESSON DELIVERY (CRITICAL):** If the user asks to teach a topic (e.g., "Teach me Photosynthesis"), do NOT give a summary. Teach a **COMPLETE LESSON** like a professor.
    *   **Introduction:** Start with a "Hook" or real-life connection. ("Aaj hum [Topic] padhenge, jo bahut interesting hai kyunki...")
    *   **Core Concept:** Explain the "What", "Why", and "How" in detail.
    *   **The "Desi" Analogy:** ALWAYS explain using a simple, daily-life analogy. (e.g., "Current is like water flowing in a pipe...").
    *   **Deep Dive:** Cover types, parts, or formulas. Don't skip the details.
    *   **Conclusion:** Summarize the key points and give a "Pro Tip".
2.  **VERIFIED SOURCES:** When explaining facts, news, or scientific data, use your **Google Search tool** to find the latest info and say: "Verified sources ke mutabik..." or "Latest data ye kehta hai...".
3.  **LANGUAGE & TONE:** Speak in natural, energetic **Hinglish** (English + Hindi).
    *   Be encouraging: "Shabaash!", "Ye point samjhe?", "Koi doubt hai?".
    *   Never be boring. Be interactive.
4.  **CHECK FOR UNDERSTANDING:** Don't speak continuously for too long. After explaining a complex part, ask: "Yahan tak clear hua? Aage badhein?"

**MATH & LOGIC SPECIFIC:**
*   **Method First:** Explain the logic *before* the formula.
*   **Step-by-Step:** Solve problems clearly: "Step 1: Pehle hum..."

**FORMATTING:**
*   Use bullet points for lists.
*   **Bold** important terms.
`;

const SUBJECT_MODES = [
  { 
    id: 'universal', 
    name: 'Universal', 
    description: 'General Tutor & News',
    icon: GraduationCap,
    // Using Tailwind classes for dynamic styling
    color: 'blue', 
    gradient: 'from-blue-600 to-cyan-500',
    shadow: 'shadow-blue-500/50',
    border: 'border-blue-500/50',
    text: 'text-blue-200',
    prompt: `${BASE_TEACHER_PERSONA}
    **CURRENT MODE: UNIVERSAL TEACHER**
    - You can teach ANY subject.
    - **Current Affairs:** If asked about 'Live News', 'Cricket Score', or 'Recent Events', use Google Search.
    - **CRITICAL FOR NEWS:** Summarize search results into short, bullet-point style audio updates.
    - Be versatile and helpful.`
  },
  { 
    id: 'math', 
    name: 'Math', 
    description: 'Step-by-Step Solving',
    icon: Calculator,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/50',
    border: 'border-amber-500/50',
    text: 'text-amber-200',
    prompt: `${BASE_TEACHER_PERSONA}
    **CURRENT MODE: MATH WIZARD**
    - **METHOD OVER ANSWER:** Your goal is to teach the *method*.
    - Break down complex problems into small, easy steps.
    - Use analogies for abstract concepts (e.g., Functions are like machines with inputs and outputs).
    - If the user makes a mistake, correct them gently and explain *why* it was wrong.`
  },
  { 
    id: 'science', 
    name: 'Science', 
    description: 'Biology & Physics',
    icon: FlaskConical,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    shadow: 'shadow-emerald-500/50',
    border: 'border-emerald-500/50',
    text: 'text-emerald-200',
    prompt: `${BASE_TEACHER_PERSONA}
    **CURRENT MODE: SCIENCE EXPLORER**
    - Focus on "Phenomenon -> Principle -> Application".
    - Explain the science behind everyday things (e.g., Why sky is blue, How fridge works).
    - Use diagrams descriptions if needed.`
  },
  { 
    id: 'history', 
    name: 'History', 
    description: 'Storytelling',
    icon: ScrollText,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/50',
    border: 'border-rose-500/50',
    text: 'text-rose-200',
    prompt: `${BASE_TEACHER_PERSONA}
    **CURRENT MODE: HISTORY NARRATOR**
    - Teach History like a compelling STORY, not just dates.
    - Structure: "Background (The Cause)" -> "The Event (The Action)" -> "Aftermath (The Effect)".
    - Connect past events to current world situations if relevant.`
  },
  { 
    id: 'coding', 
    name: 'Coding', 
    description: 'Logic & Code',
    icon: Terminal,
    color: 'violet',
    gradient: 'from-violet-600 to-purple-600',
    shadow: 'shadow-violet-500/50',
    border: 'border-violet-500/50',
    text: 'text-violet-200',
    prompt: `${BASE_TEACHER_PERSONA}
    **CURRENT MODE: CODING MENTOR**
    - Explain the LOGIC before writing code.
    - Use "Pseudocode" or simple explanations first.
    - Debugging: Help the user find errors by asking guiding questions.`
  }
];

// --- Custom Markdown Components ---
const MarkdownComponents = {
  p: ({children}: any) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
  ul: ({children}: any) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300">{children}</ul>, 
  ol: ({children}: any) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300">{children}</ol>,
  li: ({children}: any) => <li className="pl-1 text-slate-200">{children}</li>,
  strong: ({children}: any) => <span className="font-bold text-indigo-300">{children}</span>,
  h1: ({children}: any) => <h1 className="text-xl md:text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-white/10 flex items-center gap-2">{children}</h1>,
  h2: ({children}: any) => <h2 className="text-lg md:text-xl font-bold text-indigo-400 mt-6 mb-3 flex items-center gap-2">{children}</h2>,
  h3: ({children}: any) => <h3 className="text-base font-semibold text-slate-100 mt-4 mb-2">{children}</h3>,
  blockquote: ({children}: any) => <blockquote className="border-l-4 border-amber-500 pl-4 my-4 italic text-slate-300 bg-amber-500/10 py-3 rounded-r-lg">{children}</blockquote>,
  code: ({children}: any) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs border border-white/10">{children}</code>,
  pre: ({children}: any) => <pre className="bg-black/40 p-4 rounded-xl overflow-x-auto my-4 border border-white/10 text-xs text-slate-200 shadow-inner">{children}</pre>,
  a: ({href, children}: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{children}</a>
};

// --- Plans Data ---
const PRICING_PLANS = [
  {
    id: 'trial',
    name: '1 Month Free',
    price: 0,
    label: 'Free Trial',
    features: ['Access to all subjects', 'Basic AI Tutor', 'Standard speed'],
    recommended: false
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 59,
    label: '₹59 / Month',
    features: ['Unlimited conversations', 'Priority Response', 'All Subject Modes', 'Exam Prep Mode'],
    recommended: false
  },
  {
    id: 'yearly',
    name: 'Yearly Pro',
    price: 559,
    label: '₹559 / Year',
    features: ['Best Value', 'Exclusive Study Material', 'Beta Features Access', '24/7 Support'],
    recommended: true
  }
];

// --- Types ---
interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    trialStartDate?: string;
    plan: 'trial' | 'monthly' | 'yearly';
}

interface HistoryItem {
    id: number;
    subject: string;
    topic: string;
    date: string;
    duration: string;
}

export const JarvisInterface: React.FC = () => {
  // Core State
  const [activeSubjectId, setActiveSubjectId] = useState('universal');
  const selectedVoice = 'Zephyr';
  const [hasApiKey, setHasApiKey] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Upgrade & Subscription State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  // Auth & History & Policies State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<'privacy' | 'terms' | 'refund' | 'contact'>('privacy');
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // History Data State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastHistoryMsgId = useRef<string | null>(null);

  // Derived State
  const activeSubject = SUBJECT_MODES.find(s => s.id === activeSubjectId) || SUBJECT_MODES[0];

  const { 
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
  } = useMultimodalLive({
    systemInstruction: activeSubject.prompt,
    voiceName: selectedVoice
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasStartedRef = useRef(false);

  // --- Utility Functions ---

  const checkAccess = (): boolean => {
      if (!user) {
          setShowAuthModal(true);
          return false;
      }

      // Check if trial is expired
      if (user.plan === 'trial' && user.trialStartDate) {
          const startDate = new Date(user.trialStartDate).getTime();
          const currentDate = new Date().getTime();
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          
          if (currentDate - startDate > thirtyDaysInMs) {
              // Block Access
              setShowUpgradeModal(true);
              return false;
          }
      }
      return true;
  };

  // --- Effects ---

  // Check Local Storage and API Key on Mount
  useEffect(() => {
    if ((window as any).aistudio) {
      (window as any).aistudio.hasSelectedApiKey().then(setHasApiKey);
    } else {
      setHasApiKey(true);
    }

    // Load User
    const storedUser = localStorage.getItem('jarvis_user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setActivePlan(parsedUser.plan);
    } else {
        setShowAuthModal(true);
    }

    // Load History
    const storedHistory = localStorage.getItem('jarvis_history');
    if (storedHistory) {
        try {
            setHistory(JSON.parse(storedHistory));
        } catch (e) {
            console.error("Error loading history", e);
        }
    }
  }, []);

  // Reset startup state on disconnect
  useEffect(() => {
      if (connectionState === 'disconnected') {
          hasStartedRef.current = false;
      }
  }, [connectionState]);

  // Inform AI of Subject Change if connected
  useEffect(() => {
    if (connectionState === 'connected') {
        // Only if it's NOT the start of the session, send the hidden switch message.
        // If it IS the start, the block below handles the greeting.
        if (hasStartedRef.current) {
             // Send a hidden system prompt to switch context so the AI knows (but user doesn't see [SYSTEM...])
             sendHiddenMessage(`[SYSTEM: The user has switched to ${activeSubject.name} mode. Please adopt the ${activeSubject.name} persona immediately and help with ${activeSubject.name} related topics.]`);
        }

        // If this is the start of the session, instruct AI to SPEAK FIRST.
        if (!hasStartedRef.current) {
             // We use a HIDDEN system message to force the AI to introduce itself.
             // This mimics the 'Tutor speaks first' behavior requested.
             sendHiddenMessage(`[SYSTEM: The session has just started. You are now the ${activeSubject.name} teacher. Immediately introduce yourself enthusiastically in Hinglish and ask the student what they want to learn today. Keep it short and engaging.]`);
             hasStartedRef.current = true;
        }
    }
  }, [activeSubjectId, connectionState, activeSubject.name, sendHiddenMessage]);

  // Update History when user sends a message
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMsg = messages[messages.length - 1];
    
    // Check if it is a user message and not already processed
    if (lastMsg.role === 'user' && lastMsg.id !== lastHistoryMsgId.current) {
        lastHistoryMsgId.current = lastMsg.id;
        
        const newItem: HistoryItem = {
            id: Date.now(),
            subject: activeSubject.name,
            topic: lastMsg.text.length > 60 ? lastMsg.text.substring(0, 60) + '...' : lastMsg.text,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: 'Chat'
        };

        setHistory(prev => {
            const updated = [newItem, ...prev];
            localStorage.setItem('jarvis_history', JSON.stringify(updated));
            return updated;
        });
    }
  }, [messages, activeSubject.name]);

  // Auto-scroll logic
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [messages, inProgressInput, inProgressOutput]);

  // Handle pending message sending upon connection
  useEffect(() => {
    if (connectionState === 'connected' && pendingMessage) {
      sendTextMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [connectionState, pendingMessage, sendTextMessage]);

  // --- Handlers ---

  const handleToggleConnection = async () => {
    if (!checkAccess()) return; // Block if trial expired

    if (connectionState === 'connected' || connectionState === 'connecting') {
      disconnect();
    } else {
      if (!hasApiKey && (window as any).aistudio) {
        try {
          const success = await (window as any).aistudio.openSelectKey();
          if (success) {
            setHasApiKey(true);
            connect();
          }
        } catch (e) {
            console.error(e);
        }
      } else {
        connect();
      }
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;

    if (!checkAccess()) return; // Block if trial expired

    if (connectionState === 'connected') {
      sendTextMessage(inputText);
      setInputText('');
    } else {
      setPendingMessage(inputText);
      setInputText('');
      handleToggleConnection();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!checkAccess()) return; // Block if trial expired

      const file = e.target.files?.[0];
      if (!file) return;

      if (connectionState !== 'connected') {
          alert("Please connect to Jarvis first to upload files.");
          return;
      }

      // STRICT CHECK: The Live API generally doesn't support PDF streaming directly. 
      // It supports images (JPEG/PNG) and Audio.
      if (file.type === 'application/pdf') {
          alert("Sorry, PDF upload is not supported in Live Conversation mode yet. Please convert your study material to an Image (JPG/PNG) and try again.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      if (!file.type.startsWith('image/')) {
           alert("Please upload an Image file (JPG, PNG).");
           return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
          const base64Data = (ev.target?.result as string).split(',')[1];
          sendRealtimeInput(base64Data, file.type);
          
          // Introduce a small delay before sending the text prompt to ensure 
          // the server has processed the image frame header.
          setTimeout(() => {
               sendTextMessage(`I have uploaded an image: ${file.name}. Please analyze it and explain what you see.`);
          }, 500);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistory = () => {
      if (confirm("Are you sure you want to clear your entire study history?")) {
          setHistory([]);
          localStorage.removeItem('jarvis_history');
      }
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const email = formData.get('email') as string;
      const name = formData.get('name') as string || email.split('@')[0];
      
      const newUser: UserProfile = {
          name: name,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          trialStartDate: authMode === 'signup' ? new Date().toISOString() : new Date().toISOString(), 
          plan: 'trial' 
      };

      localStorage.setItem('jarvis_user', JSON.stringify(newUser));
      
      setUser(newUser);
      setActivePlan('trial');
      setShowAuthModal(false);
      
      if (authMode === 'signup') {
        alert("Welcome! Your 1-Month Free Trial has started.");
      }
  };

  const handleLogout = () => {
      if(confirm("Are you sure you want to log out?")) {
          localStorage.removeItem('jarvis_user');
          setUser(null);
          setActivePlan(null);
          disconnect();
          setShowAuthModal(true);
      }
  };

  // --- Payment / Upgrade Logic ---

  const handlePayment = (plan: typeof PRICING_PLANS[0]) => {
    if (!user) {
        setShowUpgradeModal(false);
        setAuthMode('signup');
        setShowAuthModal(true);
        return;
    }

    if (plan.price === 0) {
        alert(`You are already using the Free Trial.`);
        setShowUpgradeModal(false);
        return;
    }

    const options = {
        key: "rzp_test_RmlgM2ajiyLecF",
        amount: plan.price * 100,
        currency: "INR",
        name: "Jarvis AI Tutor",
        description: `Upgrade to ${plan.name}`,
        image: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png",
        handler: function (response: any) {
            console.log("Payment Successful", response);
            updateUserPlan(plan.name as 'monthly' | 'yearly');
            alert(`🎉 Payment Successful! You are now on the ${plan.name} plan.`);
        },
        prefill: {
            name: user.name,
            email: user.email,
            contact: "9999999999"
        },
        theme: {
            color: "#3B82F6"
        },
        modal: {
            ondismiss: function() {}
        }
    };

    try {
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
        rzp1.on('payment.failed', function (response: any){
            alert("Payment Failed. Please try again.");
        });
    } catch (error) {
        console.warn("Razorpay SDK not loaded or invalid key. Simulating success for demo.");
        const confirmSim = confirm(`(Demo Mode) Razorpay SDK is simulated.\n\nProceed to activate ${plan.name} for ₹${plan.price}?`);
        if (confirmSim) {
             updateUserPlan(plan.name as 'monthly' | 'yearly');
             alert(`🎉 Plan Activated: ${plan.name}`);
        }
    }
  };

  const updateUserPlan = (newPlan: 'monthly' | 'yearly') => {
      if (!user) return;
      const updatedUser: UserProfile = { ...user, plan: newPlan };
      setUser(updatedUser);
      setActivePlan(newPlan);
      localStorage.setItem('jarvis_user', JSON.stringify(updatedUser));
      setShowUpgradeModal(false);
  };

  // --- Render ---

  return (
    // Root: p-0 on mobile for edge-to-edge, p-6 on desktop for boxed layout
    <div className="relative w-full min-h-screen bg-black font-sans text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      
      {/* Ambient Background */}
      <div className={`fixed inset-0 transition-colors duration-1000 bg-gradient-to-br opacity-20 blur-3xl ${activeSubject.gradient.replace('from-', 'from-black via-black to-')}`} />
      
      {/* Layout Container */}
      <div className="relative z-10 w-full flex flex-col md:flex-row p-0 md:p-6 gap-0 md:gap-4 items-start">

        {/* --- LEFT PANEL: Controls --- */}
        {/* Compact Width: w-[280px] on desktop */}
        <div className="w-full md:w-[280px] flex flex-col gap-3 shrink-0 h-fit p-3 md:p-0 md:sticky md:top-6">
            
            {/* Branding & User Profile */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex justify-between items-start shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-widest">
                        JARVIS
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${activeSubject.text}`}>
                            AI Tutor
                        </span>
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 border border-white/5 uppercase`}>
                           {activeSubject.name}
                        </div>
                    </div>
                </div>
                
                {/* User Profile Button */}
                <div className="relative z-10">
                    {user ? (
                        <button onClick={handleLogout} className="flex flex-col items-center gap-1 group/user" title="Click to Logout">
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-indigo-500 shadow-lg group-hover/user:scale-105 transition-transform" />
                            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 group-hover/user:text-red-400">Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => {setAuthMode('signin'); setShowAuthModal(true)}} className="flex flex-col items-center gap-1 group/user">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/user:bg-indigo-500 group-hover/user:text-white transition-all">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Sign In</span>
                        </button>
                    )}
                </div>

                <div className={`absolute top-4 right-14 w-2 h-2 rounded-full transition-colors duration-500 ${connectionState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>

            {/* Visualizer - Reduced Height */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] md:min-h-[160px] shadow-xl">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="relative z-10 scale-90 md:scale-100">
                    <Visualizer volume={volume} isActive={connectionState === 'connected'} />
                 </div>
                 <div className="absolute bottom-4 font-mono text-[10px] text-slate-400 flex items-center gap-2">
                    {connectionState === 'connected' ? (
                        <> <Sparkles className="w-3 h-3 text-amber-400" /> <span>LISTENING...</span> </>
                    ) : (
                        <span>WAITING...</span>
                    )}
                 </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-xl flex flex-col gap-3">
                
                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <button 
                            onClick={handleToggleConnection}
                            className={`
                                flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-300 shadow-lg text-sm
                                ${connectionState === 'connected'
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/20'
                                    : `bg-gradient-to-r ${activeSubject.gradient} text-white shadow-lg hover:scale-[1.02]`
                                }
                            `}
                        >
                            {connectionState === 'connecting' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : connectionState === 'connected' ? (
                                <> <MicOff className="w-4 h-4" /> END </>
                            ) : (
                                <> <Mic className="w-4 h-4" /> START </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={connectionState !== 'connected'}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileUpload} />
                    </div>

                    {activePlan === 'trial' ? (
                         <button 
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse transition-all hover:scale-[1.02] border border-blue-400/50 text-xs"
                         >
                            <Crown className="w-4 h-4 fill-yellow-400 text-yellow-100" />
                            <span>UPGRADE</span>
                            <ChevronRight className="w-3 h-3 opacity-70" />
                         </button>
                    ) : (
                        <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 font-bold flex items-center justify-center gap-2 text-xs">
                             <Crown className="w-4 h-4 fill-amber-400" />
                             <span className="uppercase tracking-widest text-[10px]">Premium Active</span>
                        </div>
                    )}
                </div>

                {/* About & History Footer */}
                <div className="flex justify-between items-center mt-1 px-1">
                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="text-[9px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                        <History className="w-3 h-3" /> History
                    </button>
                    <button 
                         onClick={() => { setShowPolicyModal(true); }}
                         className="text-[9px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                     >
                         <FileText className="w-3 h-3" /> Policies
                     </button>
                    <button 
                        onClick={() => setShowAboutModal(true)}
                        className="text-[9px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                        <Info className="w-3 h-3" /> About
                    </button>
                </div>
            </div>
        </div>

        {/* --- RIGHT PANEL: Chat --- */}
        {/* Mobile: Top border only, Rounded Top. Desktop: All borders, Rounded. */}
        <div className="flex-1 bg-slate-900/60 backdrop-blur-2xl border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col relative min-h-[85vh] md:min-h-[600px] w-full">
            
            {/* Chat Header (Sticky) */}
            <div className="sticky top-0 z-40 h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-xl shrink-0 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${activeSubject.gradient}`}>
                        <activeSubject.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        {/* Interactive Header for History */}
                        <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="text-left group"
                        >
                            <h2 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                {activeSubject.name} Notes
                                <History className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h2>
                            <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                                Click for History • {activeSubject.description}
                            </p>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {user && (
                        <div className="hidden md:flex items-center gap-2 mr-2 border-r border-white/10 pr-4">
                            <span className="text-xs text-slate-400">Hello, {user.name}</span>
                        </div>
                    )}
                    {activePlan !== 'trial' && (
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> 
                            <span className="text-[10px] font-bold text-amber-500 uppercase">PRO</span>
                         </div>
                    )}
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 px-2 md:p-6 space-y-6 relative pb-32" ref={scrollRef}>
                 {messages.length === 0 && !inProgressInput && !inProgressOutput ? (
                    // Centered System Ready Screen with Module Suggestions
                    <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 md:pt-24 p-6 overflow-y-auto">
                         {/* Large Background Icon (Faded) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                             <activeSubject.icon className="w-96 h-96" />
                        </div>

                        <div className="relative z-10 text-center mb-8 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
                                Hello, {user ? user.name.split(' ')[0] : 'Student'}
                            </h2>
                            <p className="text-slate-400 text-lg">
                                I'm Jarvis. Select a module to begin your study session.
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                            {SUBJECT_MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setActiveSubjectId(mode.id)}
                                    className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all text-left hover:scale-[1.02]
                                        ${activeSubjectId === mode.id 
                                            ? `bg-gradient-to-br ${mode.gradient} border-transparent shadow-lg shadow-${mode.color}-500/20` 
                                            : 'bg-[#1e293b]/50 backdrop-blur-sm border-white/5 hover:bg-white/5 hover:border-white/20'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className={`p-2 rounded-lg ${activeSubjectId === mode.id ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>
                                            <mode.icon className="w-5 h-5" />
                                        </div>
                                        {activeSubjectId === mode.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${activeSubjectId === mode.id ? 'text-white' : 'text-slate-200'}`}>
                                            {mode.name}
                                        </h3>
                                        <p className={`text-xs mt-1 ${activeSubjectId === mode.id ? 'text-white/80' : 'text-slate-500'}`}>
                                            {mode.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                 ) : (
                    <>
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                            >
                                <span className="text-[10px] font-bold text-slate-500 mb-1 px-1 uppercase tracking-wider">
                                    {msg.role === 'user' ? 'You' : 'Jarvis AI'}
                                </span>
                                <div className={`
                                    max-w-[98%] md:max-w-[90%] p-4 md:p-6 rounded-2xl text-sm md:text-base shadow-sm
                                    ${msg.role === 'user' 
                                        ? `bg-gradient-to-br ${activeSubject.gradient} text-white rounded-tr-none` 
                                        : 'bg-[#1a1b26] border border-white/5 text-slate-200 rounded-tl-none shadow-xl'
                                    }
                                `}>
                                    <ReactMarkdown components={MarkdownComponents}>
                                        {msg.text}
                                    </ReactMarkdown>
                                    
                                    {/* Sources / Citations */}
                                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                                <Search className="w-3 h-3" /> Sources
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.groundingChunks.map((chunk: any, i: number) => (
                                                    chunk.web?.uri && (
                                                        <a 
                                                            key={i} 
                                                            href={chunk.web.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs flex items-center gap-1.5 bg-black/20 hover:bg-black/40 hover:text-indigo-300 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors truncate max-w-[200px]"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                                                            {chunk.web.title || new URL(chunk.web.uri).hostname}
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing Indicators */}
                        {(inProgressInput || inProgressOutput) && (
                            <div className="space-y-4 pt-2">
                                {inProgressInput && (
                                    <div className="flex flex-col items-end opacity-70">
                                         <div className={`p-4 rounded-2xl rounded-tr-none border border-white/10 bg-white/5 text-slate-300 italic text-sm`}>
                                            {inProgressInput}...
                                         </div>
                                    </div>
                                )}
                                {inProgressOutput && (
                                    <div className="flex flex-col items-start">
                                        <div className="max-w-[90%] p-4 rounded-2xl rounded-tl-none bg-[#1a1b26]/80 border border-white/5 text-slate-300">
                                             <ReactMarkdown components={MarkdownComponents}>
                                                {inProgressOutput}
                                            </ReactMarkdown>
                                            <div className="flex gap-1 mt-2">
                                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75" />
                                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                 )}
            </div>

            {/* Sticky Input Bar */}
            <div className="p-2 md:p-4 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 shrink-0 sticky bottom-0 z-50 rounded-b-3xl">
                <div className={`
                    flex items-center gap-3 bg-[#0a0a0a] rounded-2xl px-4 py-3 border transition-all duration-300
                    ${connectionState === 'connected' ? `border-${activeSubject.color}-500/30` : 'border-white/5 opacity-80'}
                `}>
                    <input 
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={connectionState === 'connected' ? `Ask ${activeSubject.name} anything...` : "Type here to start chat..."}
                        className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-600 font-medium"
                    />
                    <button 
                        onClick={handleSendText}
                        disabled={!inputText.trim()}
                        className={`
                            p-2 rounded-xl text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100
                            bg-gradient-to-r ${activeSubject.gradient}
                        `}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </div>

      </div>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    // Prevent closing if user is not logged in
                    onClick={() => user ? setShowAuthModal(false) : null}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#0F172A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
                >
                    {/* Only show Close button if user exists (Optional re-login) */}
                    {user && (
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
                            <User className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{authMode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="text-slate-400 text-sm">
                            {authMode === 'signin' ? 'Sign in to continue your progress' : 'Join now & get 1 Month Free Trial!'}
                        </p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <input name="name" type="text" placeholder="John Doe" required className="bg-transparent border-none outline-none text-white text-sm flex-1" />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email Address</label>
                            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <input name="email" type="email" placeholder="student@example.com" required className="bg-transparent border-none outline-none text-white text-sm flex-1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                                <Key className="w-4 h-4 text-slate-500" />
                                <input name="password" type="password" placeholder="••••••••" required className="bg-transparent border-none outline-none text-white text-sm flex-1" />
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all mt-4">
                            {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-indigo-400 font-bold hover:underline">
                                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- HISTORY MODAL --- */}
      <AnimatePresence>
        {showHistoryModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowHistoryModal(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#0F172A] border border-white/10 w-full max-w-2xl rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                     <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <History className="w-6 h-6 text-indigo-400" /> Study History
                        </h2>
                        <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                <History className="w-12 h-12 mb-2 opacity-20" />
                                <p>No history yet. Start learning!</p>
                            </div>
                        ) : (
                            history.map((session) => (
                                <div key={session.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition-colors group cursor-default">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">{session.topic}</h3>
                                            <p className="text-xs text-slate-500">{session.subject} • {session.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                         <span className="text-xs font-mono text-slate-500 flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                                            <Clock className="w-3 h-3" /> {session.duration}
                                         </span>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>

                     <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Storage: Local Browser</span>
                        <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear All History
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- POLICIES MODAL (New) --- */}
      <AnimatePresence>
        {showPolicyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowPolicyModal(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#0F172A] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-[85vh]"
                >
                     {/* Sidebar */}
                     <div className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                Policies
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Legal & Compliance</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {[
                                { id: 'privacy', label: 'Privacy Policy', icon: Lock },
                                { id: 'terms', label: 'Terms & Conditions', icon: Scale },
                                { id: 'refund', label: 'Refund Policy', icon: RefreshCcw },
                                { id: 'contact', label: 'Contact Us', icon: Phone },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActivePolicyTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activePolicyTab === tab.id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                     </div>

                     {/* Content Area */}
                     <div className="flex-1 flex flex-col min-w-0 bg-[#0F172A]">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/50">
                            <h3 className="text-lg font-bold text-white">
                                {activePolicyTab === 'privacy' && "Privacy Policy"}
                                {activePolicyTab === 'terms' && "Terms & Conditions"}
                                {activePolicyTab === 'refund' && "Refund & Cancellation Policy"}
                                {activePolicyTab === 'contact' && "Contact Us"}
                            </h3>
                            <button onClick={() => setShowPolicyModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 text-slate-300 text-sm leading-relaxed space-y-6">
                            
                            {/* PRIVACY POLICY CONTENT */}
                            {activePolicyTab === 'privacy' && (
                                <>
                                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                                    <p>Welcome to Jarvis AI Tutor ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our application.</p>
                                    
                                    <h4 className="text-white font-bold text-base mt-4">1. Information We Collect</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Personal Data:</strong> We collect your name and email address when you register.</li>
                                        <li><strong>Audio Data:</strong> Voice inputs are processed in real-time by Google Gemini API to provide tutoring services. We do not permanently store your voice recordings.</li>
                                        <li><strong>Usage Data:</strong> We may collect information about how you interact with our app (e.g., study time, subjects accessed) to improve user experience.</li>
                                    </ul>

                                    <h4 className="text-white font-bold text-base mt-4">2. Use of Your Information</h4>
                                    <p>We use the information we collect to:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Provide, operate, and maintain our AI tutoring services.</li>
                                        <li>Process your payments and manage your subscription.</li>
                                        <li>Send you emails regarding your account or order.</li>
                                    </ul>

                                    <h4 className="text-white font-bold text-base mt-4">3. Disclosure of Your Information</h4>
                                    <p>We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners (like Google Cloud) who assist us in operating our website, conducting our business, or serving our users.</p>
                                </>
                            )}

                            {/* TERMS CONTENT */}
                            {activePolicyTab === 'terms' && (
                                <>
                                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                                    <p>Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Jarvis AI Tutor application.</p>

                                    <h4 className="text-white font-bold text-base mt-4">1. Acceptance of Terms</h4>
                                    <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

                                    <h4 className="text-white font-bold text-base mt-4">2. Subscriptions</h4>
                                    <p>Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis (such as monthly or annually).</p>

                                    <h4 className="text-white font-bold text-base mt-4">3. Content</h4>
                                    <p>Our Service allows you to chat with an AI for educational purposes. While we strive for accuracy, AI responses may occasionally be incorrect. Use the information provided at your own discretion. We are not responsible for errors in AI generation.</p>
                                    
                                    <h4 className="text-white font-bold text-base mt-4">4. User Accounts</h4>
                                    <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                                </>
                            )}

                            {/* REFUND CONTENT */}
                            {activePolicyTab === 'refund' && (
                                <>
                                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                                    <p>We want you to be satisfied with your purchase. However, if you are not, please review our refund and cancellation policy below.</p>

                                    <h4 className="text-white font-bold text-base mt-4">1. Cancellation Policy</h4>
                                    <p>You can cancel your subscription at any time. Your subscription will remain active until the end of the current billing period. To cancel, please contact our support team or use the settings in your account profile.</p>

                                    <h4 className="text-white font-bold text-base mt-4">2. Refund Policy</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>7-Day Money-Back Guarantee:</strong> If you are not satisfied with our service, you can request a full refund within 7 days of your initial purchase.</li>
                                        <li><strong>Processing Time:</strong> Refunds will be processed within 5-7 business days to the original payment method.</li>
                                        <li><strong>Eligibility:</strong> Refunds are only applicable to the first month of a subscription or a yearly plan. Subsequent renewals are non-refundable unless there is a technical error on our part.</li>
                                    </ul>

                                    <h4 className="text-white font-bold text-base mt-4">3. Contact Us for Refunds</h4>
                                    <p>If you have any questions about our Returns and Refunds Policy, please contact us at the email provided in the Contact Us section.</p>
                                </>
                            )}

                            {/* CONTACT CONTENT */}
                            {activePolicyTab === 'contact' && (
                                <>
                                    <p>If you have any questions about these Terms, Privacy Policy, or Refund Policy, please contact us:</p>
                                    
                                    <div className="grid gap-6 mt-6">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-indigo-400 font-bold mb-2 text-xs uppercase tracking-wider">Merchant / Developer Name</h4>
                                            <p className="text-white font-medium">yashvortex</p>
                                        </div>

                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-indigo-400 font-bold mb-2 text-xs uppercase tracking-wider">Contact Email</h4>
                                            <p className="text-white font-medium">yashvortex82@gmail.com</p>
                                        </div>

                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-indigo-400 font-bold mb-2 text-xs uppercase tracking-wider">Social Profiles</h4>
                                            <div className="flex gap-4 mt-2">
                                                 <a href="https://github.com/yashuai209" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs bg-black/30 px-3 py-2 rounded-lg transition-colors">
                                                     <Github className="w-3 h-3" /> GitHub
                                                 </a>
                                                 <a href="https://www.instagram.com/yashwa_ntlifestyle?igsh=Mm5lZjdianhvZ2hh" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs bg-black/30 px-3 py-2 rounded-lg transition-colors">
                                                     <Instagram className="w-3 h-3" /> Instagram
                                                 </a>
                                                 <a href="https://www.linkedin.com/in/yashwant-kumar-94888b343" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs bg-black/30 px-3 py-2 rounded-lg transition-colors">
                                                     <Linkedin className="w-3 h-3" /> LinkedIn
                                                 </a>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                     </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- ABOUT & PRIVACY MODAL --- */}
      <AnimatePresence>
        {showAboutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAboutModal(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#0F172A] border border-white/10 w-full max-w-2xl rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                     <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Info className="w-5 h-5 text-indigo-400" /> About Jarvis</h2>
                        <button onClick={() => setShowAboutModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                     </div>
                     
                     <div className="p-8 overflow-y-auto space-y-8">
                        {/* About */}
                        <section>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-amber-400" /> About Jarvis AI Tutor</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Jarvis is an advanced voice-activated study companion powered by Google's Gemini Multimodal Live API. It is designed to act as a personalized tutor, helping students understand complex concepts in Math, Science, History, and Coding through natural conversation and structured notes.
                            </p>
                        </section>

                        {/* User Privacy */}
                        <section>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-emerald-400" /> User Privacy</h3>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                <div className="flex gap-3">
                                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">Data Processing</h4>
                                        <p className="text-xs text-slate-400 mt-1">Audio and text inputs are sent to Google Gemini API for real-time processing. No personal audio is permanently stored on our servers.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Key className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">API Keys</h4>
                                        <p className="text-xs text-slate-400 mt-1">Your Google API Key is stored locally in your browser session and is never shared with third parties.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                         {/* Developer Socials */}
                         <section>
                             <h3 className="text-lg font-bold text-white mb-3">Connect with Developer</h3>
                             <div className="flex gap-4 flex-wrap">
                                 <a href="https://github.com/yashuai209" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24292e] hover:bg-[#2f363d] text-white transition-colors">
                                     <Github className="w-4 h-4" /> <span>GitHub</span>
                                 </a>
                                 <a href="https://www.instagram.com/yashwa_ntlifestyle?igsh=Mm5lZjdianhvZ2hh" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E1306C]/20 text-[#E1306C] hover:bg-[#E1306C]/30 transition-colors">
                                     <Instagram className="w-4 h-4" /> <span>Instagram</span>
                                 </a>
                                 <a href="https://www.linkedin.com/in/yashwant-kumar-94888b343?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/30 transition-colors">
                                     <Linkedin className="w-4 h-4" /> <span>LinkedIn</span>
                                 </a>
                             </div>
                         </section>
                     </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- PRICING MODAL --- */}
      <AnimatePresence>
        {showUpgradeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    // If access is blocked, do not allow closing without upgrading
                    onClick={() => activePlan === 'trial' ? setShowUpgradeModal(false) : null}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#0F172A] border border-blue-500/30 w-full max-w-4xl rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Jarvis <span className="text-blue-400">Pro</span></h2>
                                <p className="text-slate-400">
                                    {user?.plan === 'trial' && user?.trialStartDate && (new Date().getTime() - new Date(user.trialStartDate).getTime() > 30 * 24 * 60 * 60 * 1000) 
                                        ? <span className="text-red-400 font-bold">Your Free Trial has expired. Please upgrade to continue learning.</span> 
                                        : "Unlock the full potential of your AI Tutor."}
                                </p>
                            </div>
                            <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PRICING_PLANS.map((plan) => (
                                <div key={plan.id} className={`relative rounded-2xl p-6 flex flex-col border transition-all duration-300 hover:scale-[1.02] ${plan.recommended ? 'bg-gradient-to-b from-blue-900/40 to-slate-900/40 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'bg-slate-900/40 border-white/10'}`}>
                                    {plan.recommended && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>)}
                                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                                    <div className="mb-4"><span className="text-3xl font-bold text-white">₹{plan.price}</span>{plan.price > 0 && <span className="text-slate-500 text-sm"> / {plan.id === 'yearly' ? 'year' : 'mo'}</span>}</div>
                                    <ul className="space-y-3 mb-8 flex-1">{plan.features.map((feature, i) => (<li key={i} className="flex items-center gap-2 text-sm text-slate-300"><Check className={`w-4 h-4 ${plan.recommended ? 'text-blue-400' : 'text-slate-500'}`} />{feature}</li>))}</ul>
                                    <button onClick={() => handlePayment(plan)} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.recommended ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}>{plan.price === 0 ? 'Start Free Trial' : 'Buy Now'}{plan.price > 0 && <CreditCard className="w-4 h-4" />}</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};