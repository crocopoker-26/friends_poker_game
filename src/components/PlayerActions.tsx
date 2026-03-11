import React from 'react';
import { GameState, Player } from '../types';

interface PlayerActionsProps {
  gameState: GameState;
  me: Player;
  raiseAmount: number;
  setRaiseAmount: (amount: number) => void;
  takeAction: (action: 'fold' | 'call' | 'raise', amount?: number) => void;
}

export const PlayerActions: React.FC<PlayerActionsProps> = ({
  gameState,
  me,
  raiseAmount,
  setRaiseAmount,
  takeAction
}) => {
  return (
    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">
      
      {/* Quick Raise Shortcuts */}
      {gameState.currentTurn === me.seat && (
         <div className="flex gap-2 mr-1">
           {[0.5, 0.75, 1].map((pct) => {
              const amount = Math.floor(gameState.pot * pct);
              const canRaise = amount > gameState.highestBet && amount <= (me.chips + me.currentBet);
              return (
                 <button
                   key={pct}
                   onClick={() => setRaiseAmount(amount)}
                   disabled={!canRaise}
                   className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[10px] md:text-xs font-bold tracking-wider transition-all backdrop-blur-md shadow-lg"
                 >
                   {pct * 100}%
                 </button>
              );
           })}
         </div>
      )}

      <div className="bg-slate-900/90 border border-slate-700/60 p-2 md:p-3 rounded-2xl backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-stretch gap-2 shrink-0 max-w-[calc(100vw-2rem)] overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => takeAction('fold')}
          disabled={gameState.currentTurn !== me.seat}
          className="h-[52px] md:h-[60px] px-4 md:px-6 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-500/40 hover:border-rose-400/60 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black md:tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(225,29,72,0.2)] active:scale-95 text-xs md:text-sm whitespace-nowrap flex items-center justify-center"
        >
          FOLD
        </button>
        
        <button 
          onClick={() => takeAction('call')}
          disabled={gameState.currentTurn !== me.seat}
          className="h-[52px] md:h-[60px] px-4 md:px-6 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 hover:border-slate-400/60 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black md:tracking-widest transition-all flex flex-col items-center justify-center gap-0.5 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 text-xs md:text-sm whitespace-nowrap min-w-[80px] md:min-w-[100px]"
        >
          <span>{gameState.highestBet > me.currentBet ? 'CALL' : 'CHECK'}</span>
          {gameState.highestBet > me.currentBet && (
             <span className="text-[10px] md:text-xs font-mono font-medium text-slate-400">{Math.min(me.chips, gameState.highestBet - me.currentBet)}</span>
          )}
        </button>
        
        <div className="flex flex-col md:flex-row gap-2 shrink-0 items-stretch">
          <input 
            type="number" 
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            min={gameState.highestBet + gameState.bigBlind}
            max={me.chips + me.currentBet}
            disabled={gameState.currentTurn !== me.seat}
            className="w-16 md:w-24 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2 text-center text-sm md:text-base font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-inner"
          />
          <button 
            onClick={() => takeAction('raise', raiseAmount)}
            disabled={gameState.currentTurn !== me.seat || raiseAmount <= gameState.highestBet || raiseAmount > me.chips + me.currentBet}
            className="h-[52px] md:h-[60px] px-4 md:px-6 bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-500 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black md:tracking-widest transition-all flex flex-col items-center justify-center gap-0.5 hover:-translate-y-0.5 hover:shadow-[0_5px_20px_rgba(99,102,241,0.4)] active:scale-95 text-xs md:text-sm whitespace-nowrap min-w-[80px] md:min-w-[100px]"
          >
            <span>RAISE</span>
            <span className="text-[10px] md:text-xs font-mono font-medium text-indigo-200">TO {raiseAmount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
