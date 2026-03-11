import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Player, GameState } from './types';
import { LoginView } from './components/LoginView';
import { HostControls } from './components/HostControls';
import { GameTable } from './components/GameTable';
import { PlayerSeat } from './components/PlayerSeat';
import { PlayerActions } from './components/PlayerActions';

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
    // Development Mocking Check via URL ?mock=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock') === 'true') {
       setRole('player');
       setMyId('mock123');
       setGameState({
          phase: 'pre_flop',
          pot: 120,
          currentTurn: 0,
          highestBet: 50,
          bigBlind: 10,
          dealerButton: 1,
          communityCards: [],
          smallBlind: 5,
          winnerInfo: null,
       });
       setPlayers([
          { id: 'mock123', name: 'UI Tester', status: 'playing', chips: 1500, currentBet: 50, seat: 0, holeCards: ['As', 'Kh'], hasActed: false },
          { id: 'mock456', name: 'Opponent', status: 'playing', chips: 2000, currentBet: 10, seat: 1, holeCards: [], hasActed: false }
       ]);
       return;
    }

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
      <LoginView 
        name={name}
        setName={setName}
        joinAsHost={joinAsHost}
        joinAsPlayer={joinAsPlayer}
      />
    );
  }

  const me = players.find(p => p.id === myId);
  const seatedPlayers = players.filter(p => p.seat !== null);
  const waitingPlayers = players.filter(p => p.status === 'waiting_approval' && p.seat !== null);

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
                Texas Hold'em <span className="ml-2.5 opacity-80 font-normal text-sm">| Custom Game</span>
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
           <HostControls 
             gameState={gameState}
             seatedPlayers={seatedPlayers}
             waitingPlayers={waitingPlayers}
             showForceResetConfirm={showForceResetConfirm}
             setShowForceResetConfirm={setShowForceResetConfirm}
             startGame={startGame}
             approvePlayer={approvePlayer}
             kickPlayer={kickPlayer}
             forceReset={() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                   ws.send(JSON.stringify({ type: 'force_reset' }));
                }
                setShowForceResetConfirm(false);
             }}
           />
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

        {/* Game Area */}
        {gameState && (
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl p-4 md:p-10 backdrop-blur-md flex flex-col relative overflow-hidden min-h-[500px]">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Winner Info */}
            {gameState.winnerInfo && (
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 px-6 py-3 rounded-full font-bold text-lg z-50 whitespace-nowrap shadow-[0_0_30px_rgba(99,102,241,0.4)] backdrop-blur-md animate-bounce">
                {gameState.winnerInfo}
              </div>
            )}

            <GameTable gameState={gameState}>
               {/* Players */}
               {(() => {
                 const bottomSeat = (role === 'player' && me && me.seat !== null) ? me.seat : 0;
                 const topSeat = bottomSeat === 0 ? 1 : 0;

                 return [topSeat, bottomSeat].map((seatIndex) => {
                   const player = seatedPlayers.find(p => p.seat === seatIndex);
                   const isHero = seatIndex === bottomSeat;
                   const isTop = seatIndex === topSeat;
                   const isCurrentTurn = gameState.currentTurn === seatIndex && ['pre_flop', 'flop', 'turn', 'river'].includes(gameState.phase);
                   const isDealer = gameState.dealerButton === seatIndex;
                   
                   return (
                     <PlayerSeat 
                       key={seatIndex}
                       player={player}
                       seatIndex={seatIndex}
                       isHero={isHero}
                       isTop={isTop}
                       isCurrentTurn={isCurrentTurn}
                       isDealer={isDealer}
                     />
                   );
                 });
               })()}
            </GameTable>

            {/* Player Actions Fixed to Bottom Right */}
            {role === 'player' && me?.status === 'playing' && ['pre_flop', 'flop', 'turn', 'river'].includes(gameState?.phase) && (
               <PlayerActions 
                 gameState={gameState}
                 me={me}
                 raiseAmount={raiseAmount}
                 setRaiseAmount={setRaiseAmount}
                 takeAction={takeAction}
               />
            )}
          </div>
        )}

        {/* Player Waiting Banner */}
        {role === 'player' && (me?.status === 'approved' || me?.status === 'waiting_approval') && ['pre_flop', 'flop', 'turn', 'river'].includes(gameState?.phase) && me?.seat !== null && (
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
