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
        <div className="bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold mb-8 text-center text-emerald-400">Texas Hold'em</h1>
          
          <div className="space-y-6">
            <button 
              onClick={joinAsHost}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Create Game (Host)
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-800 text-zinc-400">OR</span>
              </div>
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={joinAsPlayer}
                disabled={!name}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <User size={20} />
                Join as Player
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
    <div className="min-h-screen bg-zinc-900 text-white p-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-zinc-800 p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-emerald-400">Texas Hold'em (Pre-flop only)</h1>
          <div className="flex gap-4 text-sm text-zinc-400">
            <div>Role: <span className="text-white capitalize">{role}</span></div>
            {me && <div>Name: <span className="text-white">{me.name}</span></div>}
          </div>
        </div>

        {/* Host Controls */}
        {role === 'host' && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Host Controls</h2>
              <button 
                onClick={startGame}
                disabled={gameState?.phase === 'pre_flop' || seatedPlayers.filter(p => p.status === 'approved' || p.status === 'playing' || p.status === 'folded' || p.status === 'all_in').length < 2}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Play size={18} />
                {gameState?.phase === 'showdown' ? 'Next Hand' : gameState?.phase === 'pre_flop' ? 'Game in Progress' : 'Start Game'}
              </button>

              {gameState?.phase === 'pre_flop' && (
                <div className="mt-2">
                  {!showForceResetConfirm ? (
                    <button 
                      onClick={() => setShowForceResetConfirm(true)}
                      className="py-2 px-4 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg font-semibold transition text-sm w-full"
                    >
                      Force End Hand
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                      <span className="text-sm font-semibold text-red-200 text-center">Are you sure? This will cancel the hand.</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                              ws.send(JSON.stringify({ type: 'force_reset' }));
                            }
                            setShowForceResetConfirm(false);
                          }}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md font-bold text-sm"
                        >
                          Yes, Force End
                        </button>
                        <button 
                          onClick={() => setShowForceResetConfirm(false)}
                          className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-zinc-800 p-6 rounded-2xl max-h-[400px] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Manage Players</h2>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Pending Approvals</h3>
                {waitingPlayers.length === 0 ? (
                  <p className="text-zinc-500 text-sm italic">No players waiting.</p>
                ) : (
                  <div className="space-y-2">
                    {waitingPlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-700/50">
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-zinc-400 text-sm ml-2">Seat {p.seat! + 1} • {p.chips} chips</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approvePlayer(p.id, true)} className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition" title="Approve">
                            <Check size={16} />
                          </button>
                          <button onClick={() => approvePlayer(p.id, false)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition" title="Reject">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Seated Players</h3>
                {seatedPlayers.filter(p => p.status !== 'waiting_approval').length === 0 ? (
                  <p className="text-zinc-500 text-sm italic">No players seated.</p>
                ) : (
                  <div className="space-y-2">
                    {seatedPlayers.filter(p => p.status !== 'waiting_approval').map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-700/50">
                        <div>
                          <span className="font-medium text-emerald-400">{p.name}</span>
                          <span className="text-zinc-400 text-sm ml-2">Seat {p.seat! + 1} • {p.chips} chips</span>
                        </div>
                        <button 
                          onClick={() => kickPlayer(p.id)} 
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition text-xs font-bold"
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
          <div className="bg-zinc-800 p-6 rounded-2xl max-w-md mx-auto mb-8">
            <h2 className="text-xl font-semibold mb-6">Choose Seat & Buy-in</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Seat</label>
                <div className="flex gap-4">
                  {[0, 1].map(s => {
                    const isTaken = seatedPlayers.some(p => p.seat === s);
                    return (
                      <button
                        key={s}
                        onClick={() => setSeat(s)}
                        disabled={isTaken}
                        className={`flex-1 py-3 rounded-xl border-2 transition ${isTaken ? 'opacity-50 cursor-not-allowed border-zinc-700 bg-zinc-800' : seat === s ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-600 hover:border-zinc-500'}`}
                      >
                        Seat {s + 1} {isTaken && '(Taken)'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Buy-in Chips</label>
                <input 
                  type="number" 
                  value={buyIn}
                  onChange={(e) => setBuyIn(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                onClick={sitDown}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold transition"
              >
                Sit Down
              </button>
            </div>
          </div>
        )}

        {role === 'player' && me?.status === 'waiting_approval' && me.seat !== null && (
          <div className="text-center p-12 bg-zinc-800 rounded-2xl mb-8">
            <div className="animate-pulse text-emerald-400 mb-4">Waiting for host approval...</div>
            <p className="text-zinc-400">You requested Seat {me.seat + 1} with {me.chips} chips.</p>
          </div>
        )}

        {/* Game Table */}
        {gameState && (
          <div className="bg-[#1a3622] rounded-[3rem] p-8 md:p-16 relative border-8 border-zinc-800 shadow-2xl min-h-[500px] flex flex-col items-center justify-center">
            
            {/* Winner Info */}
            {gameState.winnerInfo && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-emerald-400 px-6 py-3 rounded-full font-bold text-lg z-20 whitespace-nowrap">
                {gameState.winnerInfo}
              </div>
            )}

            {/* Community Cards */}
            <div className="mb-8">
              <div className="text-center text-emerald-200/50 text-sm mb-2 font-semibold tracking-widest uppercase">Community Cards</div>
              <div className="flex gap-2 bg-black/20 p-4 rounded-2xl">
                {gameState.communityCards.length > 0 ? (
                  gameState.communityCards.map((card, i) => <div key={i}>{renderCard(card)}</div>)
                ) : (
                  Array(5).fill(0).map((_, i) => <div key={i} className="w-12 h-16 bg-black/20 rounded-md border border-white/10"></div>)
                )}
              </div>
            </div>

            {/* Pot */}
            <div className="bg-black/40 px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
              <span className="text-zinc-400 font-medium">POT</span>
              <span className="text-2xl font-bold text-amber-400">{gameState.pot}</span>
            </div>

            {/* Players */}
            {(() => {
              const bottomSeat = (role === 'player' && me && me.seat !== null) ? me.seat : 0;
              const topSeat = bottomSeat === 0 ? 1 : 0;

              return [topSeat, bottomSeat].map(seatIndex => {
                const player = seatedPlayers.find(p => p.seat === seatIndex);
                const isTop = seatIndex === topSeat;
                const isCurrentTurn = gameState.currentTurn === seatIndex && gameState.phase === 'pre_flop';
                const isDealer = gameState.dealerButton === seatIndex;
                
                if (!player) {
                  return (
                    <div key={seatIndex} className={`absolute ${isTop ? 'top-8' : 'bottom-8'} left-1/2 -translate-x-1/2 text-white/20 font-medium border-2 border-dashed border-white/20 rounded-2xl px-8 py-4`}>
                      Empty Seat {seatIndex + 1}
                    </div>
                  );
                }

                return (
                  <div key={seatIndex} className={`absolute ${isTop ? 'top-4' : 'bottom-4'} left-1/2 -translate-x-1/2 flex flex-col items-center ${isCurrentTurn ? 'scale-105' : ''} transition-transform`}>
                    
                    {/* Current Bet */}
                    {player.currentBet > 0 && (
                      <div className={`absolute ${isTop ? '-bottom-12' : '-top-12'} bg-black/60 px-3 py-1 rounded-full text-amber-400 font-bold text-sm border border-amber-400/30`}>
                        Bet: {player.currentBet}
                      </div>
                    )}

                    {/* Dealer Button */}
                    {isDealer && (
                      <div className={`absolute ${isTop ? '-right-8 top-0' : '-right-8 bottom-0'} w-6 h-6 bg-white rounded-full text-black flex items-center justify-center text-xs font-bold shadow-md`}>
                        D
                      </div>
                    )}

                    {/* Cards */}
                    {(player.status === 'playing' || player.status === 'all_in' || player.status === 'folded') && (
                      <div className="flex gap-1 mb-2">
                        {player.holeCards && player.holeCards.length > 0 ? (
                          player.holeCards.map((card, i) => <div key={i}>{renderCard(card)}</div>)
                        ) : player.status !== 'folded' ? (
                          <>
                            <div className="w-10 h-14 bg-blue-900 rounded-md border border-white/20 shadow-inner"></div>
                            <div className="w-10 h-14 bg-blue-900 rounded-md border border-white/20 shadow-inner"></div>
                          </>
                        ) : null}
                      </div>
                    )}

                    {/* Player Info */}
                    <div className={`bg-zinc-900 px-6 py-2 rounded-xl border-2 ${isCurrentTurn ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-zinc-700'} min-w-[160px] text-center`}>
                      <div className="font-bold truncate">{player.name}</div>
                      <div className="text-amber-400 font-mono">{player.chips}</div>
                      {player.status !== 'playing' && player.status !== 'approved' && (
                        <div className="text-xs text-zinc-400 uppercase tracking-wider mt-1">{player.status.replace('_', ' ')}</div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Player Actions */}
        {role === 'player' && me?.status === 'playing' && gameState?.phase === 'pre_flop' && (
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-4 items-end">
              <button 
                onClick={() => takeAction('fold')}
                disabled={gameState.currentTurn !== me.seat}
                className="flex-1 py-4 bg-red-900/50 hover:bg-red-800 text-red-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition"
              >
                FOLD
              </button>
              
              <button 
                onClick={() => takeAction('call')}
                disabled={gameState.currentTurn !== me.seat}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition"
              >
                {gameState.highestBet > me.currentBet ? `CALL ${Math.min(me.chips, gameState.highestBet - me.currentBet)}` : 'CHECK'}
              </button>
              
              <div className="flex-1 flex flex-col gap-2">
                <input 
                  type="number" 
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  min={gameState.highestBet + gameState.bigBlind}
                  max={me.chips + me.currentBet}
                  disabled={gameState.currentTurn !== me.seat}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-center focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={() => takeAction('raise', raiseAmount)}
                  disabled={gameState.currentTurn !== me.seat || raiseAmount <= gameState.highestBet || raiseAmount > me.chips + me.currentBet}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition"
                >
                  RAISE TO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Waiting Banner */}
        {role === 'player' && (me?.status === 'approved' || me?.status === 'waiting_approval') && gameState?.phase === 'pre_flop' && me?.seat !== null && (
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50">
            <div className="max-w-3xl mx-auto flex items-center justify-center">
              <div className="text-emerald-400 font-bold animate-pulse py-4 text-lg">
                Game is in progress. Waiting for the next hand to begin...
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
