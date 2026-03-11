import React from 'react';
import { Users, User } from 'lucide-react';

interface LoginViewProps {
  name: string;
  setName: (name: string) => void;
  joinAsHost: () => void;
  joinAsPlayer: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  name,
  setName,
  joinAsHost,
  joinAsPlayer,
}) => {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white p-4">
      <div className="bg-slate-900/80 border border-slate-700/50 p-10 rounded-3xl shadow-2xl max-w-md w-full backdrop-blur-md">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Users className="text-indigo-400" size={32} />
           </div>
        </div>
        <h1 className="text-3xl font-black mb-10 text-center text-white tracking-tight">Texas Hold'em</h1>
        
        <div className="space-y-8">
          <button 
            onClick={joinAsHost}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 hover:border-indigo-400 text-white rounded-xl font-black tracking-widest transition-all shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            CREATE GAME <span className="text-indigo-200 font-medium text-sm">(HOST)</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold tracking-widest">
              <span className="px-3 bg-slate-900 text-slate-500">OR JOIN GAME</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 type="text" 
                 placeholder="Enter your name" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 font-medium transition-colors shadow-inner"
               />
            </div>
            <button 
              onClick={joinAsPlayer}
              disabled={!name}
              className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              JOIN TABLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
