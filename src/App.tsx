import React, { useState, useEffect, useRef } from 'react';
import { Users, Play, Check, X, User } from 'lucide-react';

type PlayerStatus = 'waiting_approval' | 'approved' | 'playing' | 'folded' | 'all_in';

interface Player {
  id: string;
  name: string;
  seat: number | null;
  chips: number;
  status: PlayerStatus;
  holeCards: string[];
  currentBet: number;
  hasActed: boolean;
}

type GamePhase = 'waiting' | 'pre_flop' | 'showdown';

interface GameState {
  phase: GamePhase;
  pot: number;
  communityCards: string[];
  dealerButton: number;
  currentTurn: number;
  smallBlind: number;
  bigBlind: number;
  highestBet: number;
  winnerInfo: string | null;
}

export default function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [role, setRole] = useState<'host' | 'player' | null>(null);
  const [name, setName] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [seat, setSeat] = useState<number>(0);
  const [buyIn, setBuyIn] = useState<number>(1000);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [showForceResetConfirm, setShowForceResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'state_update') {
        setMyId(data.myId);
        setHostId(data.hostId);
        setGameState(data.gameState);
        setPlayers(data.players);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const joinAsHost = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join', role: 'host' }));
      setRole('host');
    }
  };

  const joinAsPlayer = () => {
    if (ws && ws.readyState === WebSocket.OPEN && name) {
      ws.send(JSON.stringify({ type: 'join', role: 'player', name }));
      setRole('player');
    }
  };

  const sitDown = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'sit', seat, buyIn }));
    }
  };

  const approvePlayer = (playerId: string, approved: boolean) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'approve', playerId, approved }));
    }
  };

  const startGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'start_game' }));
    }
  };

  const takeAction = (action: 'fold' | 'call' | 'raise', amount?: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'action', action, amount }));
    }
  };

  const kickPlayer = (playerId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'kick', playerId }));
    }
  };

  if (!role) {
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
  }

  const me = players.find(p => p.id === myId);
  const seatedPlayers = players.filter(p => p.seat !== null);
  const waitingPlayers = players.filter(p => p.status === 'waiting_approval' && p.seat !== null);

  const renderCard = (card: string) => {
    if (!card) return <div className="w-12 h-16 bg-zinc-700 rounded-md border border-zinc-600"></div>;
    const rank = card[0];
    const suit = card[1];
    const isRed = suit === 'h' || suit === 'd';
    const suitSymbol = { 'h': '♥', 'd': '♦', 'c': '♣', 's': '♠' }[suit];
    
    return (
      <div className={`w-12 h-16 bg-white rounded-md flex items-center justify-center text-xl font-bold border border-zinc-300 shadow-sm ${isRed ? 'text-red-600' : 'text-black'}`}>
        {rank}{suitSymbol}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-300 font-sans p-4 select-none overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-3">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-5 relative z-10 w-full bg-slate-900/60 border border-slate-800 shadow-2xl p-4 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 bg-indigo-600 shadow-indigo-600/20">
                <Users className="text-white" size={20} />
             </div>
             <h1 className="text-xl font-black text-white tracking-tight flex items-center">
                Texas Hold'em <span className="ml-2.5 opacity-80 font-normal text-sm">| Pre-flop only</span>
             </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400 mt-4 lg:mt-0 font-bold">
            <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
               Role: {role === 'host' ? <span className="text-indigo-400">Host</span> : <span className="text-emerald-400">Player</span>}
            </div>
            {me && (
               <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                 Name: <span className="text-white">{me.name}</span>
               </div>
            )}
          </div>
        </div>

        {/* Host Controls */}
        {role === 'host' && (
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
                          onClick={() => {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                              ws.send(JSON.stringify({ type: 'force_reset' }));
                            }
                            setShowForceResetConfirm(false);
                          }}
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
        )}

        {/* Player Setup */}
        {role === 'player' && me?.status === 'waiting_approval' && me.seat === null && (
          <div className="bg-slate-900/80 border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-2xl max-w-md mx-auto mb-8 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">Choose Seat & Buy-in</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Seat</label>
                <div className="flex gap-4">
                  {[0, 1].map(s => {
                    const isTaken = seatedPlayers.some(p => p.seat === s);
                    return (
                      <button
                        key={s}
                        onClick={() => setSeat(s)}
                        disabled={isTaken}
                        className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold ${isTaken ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-600' : seat === s ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white bg-slate-800/50'}`}
                      >
                        Seat {s + 1} {isTaken && <span className="text-xs ml-1 font-normal opacity-70">(Taken)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Buy-in Chips</label>
                <input 
                  type="number" 
                  value={buyIn}
                  onChange={(e) => setBuyIn(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-lg shadow-inner"
                />
              </div>
              <button 
                onClick={sitDown}
                className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 hover:border-indigo-400 text-white rounded-xl font-black tracking-widest transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(99,102,241,0.3)] active:scale-95"
              >
                SIT DOWN
              </button>
            </div>
          </div>
        )}

        {role === 'player' && me?.status === 'waiting_approval' && me.seat !== null && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/80 border border-slate-700/50 rounded-3xl shadow-xl mb-8 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-indigo-400 font-bold text-xl mb-3 tracking-wide flex items-center gap-2">
              Waiting for host approval<span className="animate-pulse">...</span>
            </div>
            <p className="text-slate-400 font-medium bg-black/40 px-4 py-2 rounded-lg border border-slate-800">
              Seat <span className="text-white mx-1">{me.seat + 1}</span> • <span className="text-amber-400 font-mono mx-1">{me.chips}</span> chips
            </p>
          </div>
        )}

        {/* Game Table */}
        {gameState && (
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl p-4 md:p-10 backdrop-blur-md flex flex-col relative overflow-hidden min-h-[500px]">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Winner Info */}
            {gameState.winnerInfo && (
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 px-6 py-3 rounded-full font-bold text-lg z-50 whitespace-nowrap shadow-[0_0_30px_rgba(99,102,241,0.4)] backdrop-blur-md animate-bounce">
                {gameState.winnerInfo}
              </div>
            )}

            {/* Poker Table Graphic */}
            <div className="relative w-full max-w-[800px] h-[350px] md:h-[450px] mx-auto flex items-center justify-center select-none shrink-0 mt-8 mb-12">
               <div className="absolute inset-0 bg-[#2e3a4d] rounded-[160px] md:rounded-[220px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_6px_rgba(255,255,255,0.1)] border border-[#42546e]/30"></div>
               <div className="absolute inset-[25px] md:inset-[40px] bg-[#3e4f67] rounded-[135px] md:rounded-[180px] shadow-[inset_0_8px_20px_rgba(0,0,0,0.3)] border border-[#212b3b]"></div>
               <div className="absolute inset-[32px] md:inset-[50px] border border-[#2b3749] rounded-[128px] md:rounded-[170px] shadow-[0_1px_0_rgba(255,255,255,0.08)] pointer-events-none"></div>

               {/* Central Area: Pot & Community Cards */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center gap-4 w-full">
                 
                 {/* Community Cards */}
                 <div className="flex gap-2 p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                    {gameState.communityCards.length > 0 ? (
                      gameState.communityCards.map((card, i) => (
                         <div key={i} className="w-[48px] h-[68px] bg-white rounded-md border border-slate-300 flex flex-col justify-between p-1 shadow-md">
                            <span className={`text-[21px] leading-none font-black ${card[1] === 'h' || card[1] === 'd' ? 'text-red-600' : 'text-slate-900'} tracking-tighter self-start pt-0.5 pl-0.5`}>{card[0]}</span>
                            <span className={`text-[26px] leading-none ${card[1] === 'h' || card[1] === 'd' ? 'text-red-600' : 'text-slate-900'} self-end pb-2 pr-1`}>{
                               { 'h': '♥', 'd': '♦', 'c': '♣', 's': '♠' }[card[1]]
                            }</span>
                         </div>
                      ))
                    ) : (
                      Array(5).fill(0).map((_, i) => <div key={i} className="w-[48px] h-[68px] rounded-md border-[2px] border-white/5 bg-black/30 shadow-inner"></div>)
                    )}
                 </div>

                 {/* Pot */}
                 <div className="bg-[#242f40]/90 px-5 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <span className="text-slate-400 font-bold text-[12px] tracking-widest uppercase">POT</span>
                    <span className="text-amber-400 font-black text-lg">{gameState.pot}</span>
                 </div>
               </div>

               {/* Players (Seats 0 and 1 around the oval table) */}
               {(() => {
                 const bottomSeat = (role === 'player' && me && me.seat !== null) ? me.seat : 0;
                 const topSeat = bottomSeat === 0 ? 1 : 0;

                 return [topSeat, bottomSeat].map((seatIndex) => {
                   const player = seatedPlayers.find(p => p.seat === seatIndex);
                   const isHero = seatIndex === bottomSeat;
                   const isTop = seatIndex === topSeat;
                   const isCurrentTurn = gameState.currentTurn === seatIndex && gameState.phase === 'pre_flop';
                   const isDealer = gameState.dealerButton === seatIndex;
                   const isFolded = player?.status === 'folded';
                   const isAllIn = player?.status === 'all_in';

                   // Table positioning variables
                   const angle = isTop ? (Math.PI * 3) / 2 : Math.PI / 2;
                   const pushFactor = Math.abs(Math.cos(angle)); // 0 for strict top/bottom
                   
                   let yOffset = isHero ? 25 : 0;
                   const cx = 50 + (42 + pushFactor * 6) * Math.cos(angle);
                   const cy = 50 + (41 + pushFactor * 5) * Math.sin(angle) + yOffset;

                   if (!player) {
                     return (
                       <div key={seatIndex} className={`absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/20 rounded-2xl px-8 py-4 bg-black/20 backdrop-blur-sm shadow-inner`} style={{ left: `${cx}%`, top: `${cy}%` }}>
                          <span className="text-white/30 font-bold tracking-widest text-sm uppercase">Empty Seat</span>
                       </div>
                     );
                   }

                   return (
                     <React.Fragment key={`seat-${seatIndex}`}>
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
                 });
               })()}
            </div>
          </div>
        )}

        {/* Player Actions Fixed to Bottom Right */}
        {role === 'player' && me?.status === 'playing' && gameState?.phase === 'pre_flop' && (
          <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex gap-2">
            <div className="bg-slate-900/90 border border-slate-700/60 p-2 md:p-3 rounded-2xl backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-end gap-2 shrink-0 max-w-[calc(100vw-2rem)] overflow-x-auto custom-scrollbar">
              <button 
                onClick={() => takeAction('fold')}
                disabled={gameState.currentTurn !== me.seat}
                className="py-2.5 md:py-3 px-4 md:px-6 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-500/40 hover:border-rose-400/60 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black md:tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(225,29,72,0.2)] active:scale-95 text-xs md:text-sm whitespace-nowrap"
              >
                FOLD
              </button>
              
              <button 
                onClick={() => takeAction('call')}
                disabled={gameState.currentTurn !== me.seat}
                className="py-2.5 md:py-3 px-4 md:px-6 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 hover:border-slate-400/60 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black md:tracking-widest transition-all flex flex-col items-center justify-center gap-0.5 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 text-xs md:text-sm whitespace-nowrap"
              >
                <span>{gameState.highestBet > me.currentBet ? 'CALL' : 'CHECK'}</span>
                {gameState.highestBet > me.currentBet && (
                   <span className="text-[10px] md:text-xs font-mono font-medium text-slate-400">{Math.min(me.chips, gameState.highestBet - me.currentBet)}</span>
                )}
              </button>
              
              <div className="flex flex-col md:flex-row gap-2 shrink-0">
                <input 
                  type="number" 
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  min={gameState.highestBet + gameState.bigBlind}
                  max={me.chips + me.currentBet}
                  disabled={gameState.currentTurn !== me.seat}
                  className="w-16 md:w-24 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1.5 md:py-2 text-center text-sm md:text-base font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-inner"
                />
                <button 
                  onClick={() => takeAction('raise', raiseAmount)}
                  disabled={gameState.currentTurn !== me.seat || raiseAmount <= gameState.highestBet || raiseAmount > me.chips + me.currentBet}
                  className="py-2 md:py-3 px-4 md:px-6 bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-500 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black md:tracking-widest transition-all flex flex-col items-center justify-center gap-0.5 hover:-translate-y-0.5 hover:shadow-[0_5px_20px_rgba(99,102,241,0.4)] active:scale-95 text-xs md:text-sm whitespace-nowrap"
                >
                  <span>RAISE</span>
                  <span className="text-[10px] md:text-xs font-mono font-medium text-indigo-200">TO {raiseAmount}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Waiting Banner */}
        {role === 'player' && (me?.status === 'approved' || me?.status === 'waiting_approval') && gameState?.phase === 'pre_flop' && me?.seat !== null && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700/50 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 backdrop-blur-xl">
            <div className="max-w-[800px] mx-auto flex items-center justify-center">
              <div className="text-indigo-400 font-bold animate-pulse py-4 text-sm md:text-base tracking-widest uppercase flex items-center gap-2">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 Game is in progress. Waiting for next hand...
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
