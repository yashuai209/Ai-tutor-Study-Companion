import React from 'react';
import { JarvisInterface } from './components/JarvisInterface';

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#050505] text-slate-50 selection:bg-indigo-500 selection:text-white">
      <JarvisInterface />
    </div>
  );
};

export default App;