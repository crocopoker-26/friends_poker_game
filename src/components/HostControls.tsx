import React from 'react';
import { Play, Users, Check, X } from 'lucide-react';
import { GameState, Player } from '../types';

interface HostControlsProps {
  gameState: GameState | null;
  seatedPlayers: Player[];
  waitingPlayers: Player[];
  showForceResetConfirm: boolean;
  setShowForceResetConfirm: (show: boolean) => void;
  startGame: () => void;
  approvePlayer: (playerId: string, approved: boolean) => void;
  kickPlayer: (playerId: string) => void;
  forceReset: () => void;
}

export const HostControls: React.FC<HostControlsProps> = ({
  gameState,
  seatedPlayers,
  waitingPlayers,
  showForceResetConfirm,
  setShowForceResetConfirm,
  startGame,
  approvePlayer,
  kickPlayer,
  forceReset
}) => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-2xl shadow-xl flex flex-col gap-3 backdrop-blur-md">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Play size={18} className="text-indigo-400" /> Host Controls</h2>
        <button 
          onClick={startGame}
          disabled={gameState?.phase === 'pre_flop' || seatedPlayers.filter(p => p.status === 'approved' || p.status === 'playing' || p.status === 'folded' || p.status === 'all_in').length < 2}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-500 hover:border-indigo-400 rounded-lg font-bold tracking-widest transition-all flex items-center justify-center gap-2 hover:shadow-[0_4px_10px_rgba(99,102,241,0.3)] active:scale-95 text-white text-sm"
        >
          {gameState?.phase === 'showdown' ? 'NEXT HAND' : gameState?.phase === 'pre_flop' ? 'GAME IN PROGRESS' : 'START GAME'}
        </button>

        {gameState?.phase === 'pre_flop' && (
          <div className="mt-1">
            {!showForceResetConfirm ? (
              <button 
                onClick={() => setShowForceResetConfirm(true)}
                className="py-1.5 px-4 bg-rose-900/20 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-500 rounded-lg font-bold transition-all text-sm w-full"
              >
                Force End Hand
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg">
                <span className="text-xs font-bold text-rose-300 text-center">Are you sure? This will cancel the hand.</span>
                <div className="flex gap-2">
                  <button 
                    onClick={forceReset}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 border border-rose-500 text-white rounded-md font-bold text-xs shadow-sm shadow-rose-600/20"
                  >
                    Yes, Force End
                  </button>
                  <button 
                    onClick={() => setShowForceResetConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white rounded-md font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-2xl shadow-xl max-h-[250px] overflow-y-auto backdrop-blur-md">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><Users size={18} className="text-indigo-400" /> Manage Players</h2>
        
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pending Approvals</h3>
          {waitingPlayers.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No players waiting.</p>
          ) : (
            <div className="space-y-1.5">
              {waitingPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-slate-700 shadow-inner">
                  <div>
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-slate-400 text-xs ml-2 font-medium">Seat {p.seat! + 1} • <span className="text-amber-400 font-mono">{p.chips}</span></span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => approvePlayer(p.id, true)} className="p-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-md transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]" title="Approve">
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <button onClick={() => approvePlayer(p.id, false)} className="p-1.5 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white rounded-md transition-all hover:shadow-[0_0_10px_rgba(225,29,72,0.3)]" title="Reject">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Seated Players</h3>
          {seatedPlayers.filter(p => p.status !== 'waiting_approval').length === 0 ? (
            <p className="text-slate-600 text-xs italic">No players seated.</p>
          ) : (
            <div className="space-y-1.5">
              {seatedPlayers.filter(p => p.status !== 'waiting_approval').map(p => (
                <div key={p.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-slate-700 shadow-inner">
                  <div>
                    <span className="font-bold text-indigo-300 text-sm">{p.name}</span>
                    <span className="text-slate-400 text-xs ml-2 font-medium">Seat {p.seat! + 1} • <span className="text-amber-400 font-mono">{p.chips}</span></span>
                  </div>
                  <button 
                    onClick={() => kickPlayer(p.id)} 
                    className="px-2 py-1 bg-rose-900/30 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-500 rounded-md transition-all text-[10px] font-black tracking-wider hover:shadow-[0_0_10px_rgba(225,29,72,0.3)]"
                  >
                    KICK
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
