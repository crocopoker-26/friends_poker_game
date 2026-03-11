import React, { ReactNode } from 'react';
import { GameState } from '../types';

interface GameTableProps {
  gameState: GameState;
  children: ReactNode;
}

export const GameTable: React.FC<GameTableProps> = ({ gameState, children }) => {
  return (
    <div className="relative w-full max-w-[800px] h-[350px] md:h-[450px] mx-auto flex items-center justify-center select-none shrink-0 mt-8 mb-24">
       <div className="absolute inset-0 bg-[#2e3a4d] rounded-[160px] md:rounded-[220px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_6px_rgba(255,255,255,0.1)] border border-[#42546e]/30"></div>
       <div className="absolute inset-[25px] md:inset-[40px] bg-[#3e4f67] rounded-[135px] md:rounded-[180px] shadow-[inset_0_8px_20px_rgba(0,0,0,0.3)] border border-[#212b3b]"></div>
       <div className="absolute inset-[32px] md:inset-[50px] border border-[#2b3749] rounded-[128px] md:rounded-[170px] shadow-[0_1px_0_rgba(255,255,255,0.08)] pointer-events-none"></div>

       {/* Central Area: Pot & Community Cards */}
       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center gap-4 w-full">
         
         {/* Community Cards */}
         <div className="flex gap-2 p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            {Array.from({ length: 5 }).map((_, i) => {
              const card = gameState.communityCards[i];
              if (card) {
                return (
                 <div key={i} className="w-[48px] h-[68px] bg-white rounded-md border border-slate-300 flex flex-col justify-between p-1 shadow-md">
                    <span className={`text-[21px] leading-none font-black ${card[1] === 'h' || card[1] === 'd' ? 'text-red-600' : 'text-slate-900'} tracking-tighter self-start pt-0.5 pl-0.5`}>{card[0]}</span>
                    <span className={`text-[26px] leading-none ${card[1] === 'h' || card[1] === 'd' ? 'text-red-600' : 'text-slate-900'} self-end pb-2 pr-1`}>{
                       { 'h': '♥', 'd': '♦', 'c': '♣', 's': '♠' }[card[1]]
                    }</span>
                 </div>
                );
              }
              return (
                <div key={i} className="w-[48px] h-[68px] rounded-md border-[2px] border-white/5 bg-black/30 shadow-inner"></div>
              );
            })}
         </div>

         {/* Pot */}
         <div className="bg-[#242f40]/90 px-5 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <span className="text-slate-400 font-bold text-[12px] tracking-widest uppercase">POT</span>
            <span className="text-amber-400 font-black text-lg">{gameState.pot}</span>
         </div>
       </div>

       {children}
    </div>
  );
};
