import React from 'react';
import { Player } from '../types';

interface PlayerSeatProps {
  player: Player | undefined; // if undefined, renders empty seat placeholder
  seatIndex: number;
  isHero: boolean;
  isTop: boolean;
  isCurrentTurn: boolean;
  isDealer: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  seatIndex,
  isHero,
  isTop,
  isCurrentTurn,
  isDealer
}) => {
  const angle = isTop ? (Math.PI * 3) / 2 : Math.PI / 2;
  const pushFactor = Math.abs(Math.cos(angle)); // 0 for strict top/bottom
  
  let yOffset = isHero ? 30 : (isTop ? -2 : 0);
  const cx = 50 + (42 + pushFactor * 6) * Math.cos(angle);
  const cy = 50 + (38 + pushFactor * 5) * Math.sin(angle) + yOffset;
  
  if (!player) {
    return (
      <div className={`absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/20 rounded-2xl px-8 py-4 bg-black/20 backdrop-blur-sm shadow-inner`} style={{ left: `${cx}%`, top: `${cy}%` }}>
         <span className="text-white/30 font-bold tracking-widest text-sm uppercase">Empty Seat</span>
      </div>
    );
  }
  
  const isFolded = player.status === 'folded';
  const isAllIn = player.status === 'all_in';

  return (
    <React.Fragment>
       {/* Current Bet (Chips) */}
       {player.currentBet > 0 && (
          <div className={`absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${isFolded ? 'opacity-70' : ''}`} style={{ left: `${50 + (27 + pushFactor * 8) * Math.cos(angle)}%`, top: `${50 + (20 + pushFactor * 8) * Math.sin(angle) + (isHero ? 5 : (isTop ? -5 : 0))}%` }}>
             <div className="bg-emerald-500/90 text-white border-emerald-400 text-[12px] font-black px-3 py-1.5 min-w-[45px] text-center rounded-sm shadow-[0_2px_5px_rgba(0,0,0,0.5)] border leading-none backdrop-blur-sm">
               {player.currentBet}
             </div>
          </div>
       )}

       {/* Player Container */}
       <div className={`absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-20 transition-all hover:z-30 ${isFolded ? 'opacity-50 grayscale contrast-125 brightness-75' : ''} ${isCurrentTurn && !isFolded ? 'scale-110' : ''}`} style={{ left: `${cx}%`, top: `${cy}%` }}>
          
          {/* Cards */}
          {!isFolded && (player.status === 'playing' || player.status === 'all_in') && (
             <div className="absolute bottom-full -mb-2 md:-mb-3 flex items-center justify-center pointer-events-none w-full z-10">
                {player.holeCards && player.holeCards.length > 0 ? (
                   <div className="flex -space-x-[20px] md:-space-x-[26px] drop-shadow-xl">
                     {/* Card 1 */}
                     <div className="w-[48px] h-[68px] md:w-[60px] md:h-[85px] bg-white rounded-md border border-slate-300 flex flex-col justify-between p-1 -rotate-[5deg] transform origin-bottom-right shadow-[inset_0_0_8px_rgba(0,0,0,0.08)]">
                        <span className={`text-[21px] md:text-[26px] leading-none font-black ${player.holeCards[0][1] === 'h' || player.holeCards[0][1] === 'd' ? 'text-red-600' : 'text-slate-900'} tracking-tighter self-start pt-0.5 pl-0.5`}>{player.holeCards[0][0]}</span>
                        <span className={`text-[26px] md:text-[32px] leading-none ${player.holeCards[0][1] === 'h' || player.holeCards[0][1] === 'd' ? 'text-red-600' : 'text-slate-900'} self-end pb-1 pr-1`}>{{ 'h': '♥', 'd': '♦', 'c': '♣', 's': '♠' }[player.holeCards[0][1]]}</span>
                     </div>
                     {/* Card 2 */}
                     <div className="w-[48px] h-[68px] md:w-[60px] md:h-[85px] bg-white rounded-md border border-slate-300 flex flex-col justify-between p-1 rotate-[5deg] transform origin-bottom-left shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                        <span className={`text-[21px] md:text-[26px] leading-none font-black ${player.holeCards[1][1] === 'h' || player.holeCards[1][1] === 'd' ? 'text-red-600' : 'text-slate-900'} tracking-tighter self-start pt-0.5 pl-0.5`}>{player.holeCards[1][0]}</span>
                        <span className={`text-[26px] md:text-[32px] leading-none ${player.holeCards[1][1] === 'h' || player.holeCards[1][1] === 'd' ? 'text-red-600' : 'text-slate-900'} self-end pb-1 pr-1`}>{{ 'h': 'h', 'd': 'd', 'c': 'c', 's': 's' }[player.holeCards[1][1]] && { 'h': '♥', 'd': '♦', 'c': '♣', 's': '♠' }[player.holeCards[1][1]]}</span>
                     </div>
                   </div>
                ) : (
                   <div className="flex -space-x-[20px] md:-space-x-[26px] drop-shadow-lg">
                      <div className="w-[48px] h-[68px] md:w-[60px] md:h-[85px] rounded-md border-[2px] border-[#f8fafc] -rotate-[5deg] transform origin-bottom-right" style={{ backgroundColor: '#7d2f33', boxShadow: 'inset 0 0 0 1.5px #7d2f33, inset 0 0 0 2.5px rgba(255, 255, 255, 0.6)' }}></div>
                      <div className="w-[48px] h-[68px] md:w-[60px] md:h-[85px] rounded-md border-[2px] border-[#f8fafc] rotate-[5deg] transform origin-bottom-left" style={{ backgroundColor: '#7d2f33', boxShadow: 'inset 0 0 0 1.5px #7d2f33, inset 0 0 0 2.5px rgba(255, 255, 255, 0.6), 0 4px 10px rgba(0,0,0,0.3)' }}></div>
                   </div>
                )}
             </div>
          )}

          {/* Nameplate & Button */}
          <div className="relative">
             {isDealer && (
                <div className="absolute -left-3 -top-3 w-[24px] h-[24px] rounded-full bg-gradient-to-b from-[#fde047] to-[#f59e0b] border border-[#fef3c7] shadow-[0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center z-40">
                   <span className="text-[13px] font-black text-amber-950">D</span>
                </div>
             )}
             
             <div className={`flex flex-col items-center justify-center rounded-lg bg-black/90 overflow-hidden min-w-[100px] h-[48px] transition-all relative z-20 border-[2px] ${isCurrentTurn && !isFolded ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]' : (isHero ? 'border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-slate-700/80 shadow-xl')}`}>
                <div className={`w-full flex items-center justify-center flex-none px-3 py-1 text-[13px] font-bold tracking-wider ${isHero ? 'text-amber-400' : 'text-white'} bg-[#120f0f]`}>{player.name}</div>
                <div className={`w-full flex items-center justify-center flex-1 px-2 text-[13px] tracking-tight font-mono ${isFolded ? 'bg-slate-800 text-slate-500 font-normal' : (isAllIn ? 'bg-[#212120] text-rose-500 font-bold' : 'bg-[#212120] text-emerald-300 font-bold')}`}>
                   {isFolded ? 'FOLD' : (isAllIn ? 'ALL IN' : player.chips)}
                </div>
             </div>
             
             {/* Overlay for player status if not playing */}
             {player.status !== 'playing' && player.status !== 'approved' && !isFolded && !isAllIn && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-30">
                   <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{player.status.replace('_', ' ')}</span>
                </div>
             )}
          </div>
       </div>
    </React.Fragment>
  );
};
