import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface VisualizerProps {
  volume: number; // 0 to 255
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  // Normalize volume for scaling (0 to 1)
  const normalizedVolume = useMemo(() => Math.min(volume / 100, 1.5), [volume]);
  
  // Base scales for different rings
  const ring1Scale = isActive ? 1 + normalizedVolume * 0.5 : 1;
  const ring2Scale = isActive ? 1 + normalizedVolume * 0.8 : 1;
  const ring3Scale = isActive ? 1 + normalizedVolume * 0.3 : 1;
  const coreScale = isActive ? 1 + normalizedVolume * 0.2 : 1;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 md:w-72 md:h-72">
      {/* Outer Glow Ring */}
      <motion.div 
        className="absolute w-full h-full rounded-full border border-violet-500/20 opacity-40"
        animate={{ scale: ring3Scale, rotate: 360 }}
        transition={{ 
          scale: { type: 'spring', stiffness: 300, damping: 20 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" } 
        }}
        style={{
             boxShadow: isActive ? `0 0 60px rgba(139, 92, 246, 0.1)` : 'none'
        }}
      />
      
      {/* Middle Dynamic Ring */}
      <motion.div 
        className="absolute w-3/4 h-3/4 rounded-full border border-fuchsia-500/30 border-dashed"
        animate={{ scale: ring2Scale, rotate: -360 }}
        transition={{ 
          scale: { type: 'spring', stiffness: 400, damping: 15 },
          rotate: { duration: 15, repeat: Infinity, ease: "linear" } 
        }}
      />

      {/* Inner Active Ring */}
      <motion.div 
        className="absolute w-1/2 h-1/2 rounded-full border-[2px] border-indigo-400/50"
        animate={{ scale: ring1Scale }}
        transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        style={{
             boxShadow: `0 0 ${20 + normalizedVolume * 40}px rgba(99, 102, 241, 0.3)`
        }}
      />

      {/* Core Orb */}
      <motion.div 
        className="absolute w-1/4 h-1/4 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400"
        animate={{ 
            scale: coreScale,
            opacity: isActive ? 0.9 : 0.4
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        style={{
            boxShadow: `0 0 ${40 + normalizedVolume * 60}px ${10 + normalizedVolume * 20}px rgba(167, 139, 250, 0.6)`
        }}
      />
      
      {/* Decorative particles/lines */}
      {isActive && (
          <>
            <motion.div 
                className="absolute w-[120%] h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
                animate={{ rotate: [0, 180] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
             <motion.div 
                className="absolute w-[120%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent"
                animate={{ rotate: [90, 270] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </>
      )}
    </div>
  );
};

export default Visualizer;