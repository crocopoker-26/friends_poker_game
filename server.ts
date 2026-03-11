import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import pokersolver from 'pokersolver';

const { Hand } = pokersolver;

const app = express();
const PORT = process.env.PORT || 3000;

// Game State
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
  ws: WebSocket;
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
  deck: string[];
  winnerInfo: string | null;
}

const players = new Map<string, Player>();
let hostId: string | null = null;

let gameState: GameState = {
  phase: 'waiting',
  pot: 0,
  communityCards: [],
  dealerButton: 0,
  currentTurn: 0,
  smallBlind: 10,
  bigBlind: 20,
  highestBet: 0,
  deck: [],
  winnerInfo: null,
};

// Deck generation
const suits = ['c', 'd', 'h', 's'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function broadcastState() {
  const playersData = Array.from(players.values()).map(p => ({
    id: p.id,
    name: p.name,
    seat: p.seat,
    chips: p.chips,
    status: p.status,
    currentBet: p.currentBet,
    hasActed: p.hasActed,
  }));

  for (const [id, player] of players.entries()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      const stateForPlayer = {
        type: 'state_update',
        myId: id,
        hostId,
        gameState: {
          ...gameState,
          deck: [] // Don't send deck to clients
        },
        players: playersData.map(p => ({
          ...p,
          holeCards: (gameState.phase === 'showdown' || p.id === id || id === hostId) ? players.get(p.id)?.holeCards : []
        }))
      };
      player.ws.send(JSON.stringify(stateForPlayer));
    }
  }
}

function nextTurn() {
  const activePlayers = Array.from(players.values()).filter(p => p.seat !== null && p.status === 'playing');
  if (activePlayers.length < 1) return;

  const sortedSeated = Array.from(players.values()).filter(p => p.seat !== null).sort((a, b) => a.seat! - b.seat!);
  if (sortedSeated.length === 0) return;

  let currentIndex = sortedSeated.findIndex(p => p.seat === gameState.currentTurn);
  if (currentIndex === -1) currentIndex = 0;
  
  let nextIndex = (currentIndex + 1) % sortedSeated.length;
  let nextPlayer = sortedSeated[nextIndex];
  
  // Find next playing player
  let loopCount = 0;
  while (nextPlayer.status !== 'playing' && loopCount < sortedSeated.length) {
    nextIndex = (nextIndex + 1) % sortedSeated.length;
    nextPlayer = sortedSeated[nextIndex];
    loopCount++;
  }

  gameState.currentTurn = nextPlayer.seat!;
  broadcastState();
}

function checkRoundEnd() {
  const seatedPlayers = Array.from(players.values()).filter(p => p.seat !== null);
  const activePlayers = seatedPlayers.filter(p => p.status === 'playing' || p.status === 'all_in');
  const notFoldedPlayers = seatedPlayers.filter(p => p.status !== 'folded');

  if (notFoldedPlayers.length === 1) {
    // Everyone else folded
    const winner = notFoldedPlayers[0];
    winner.chips += gameState.pot;
    gameState.winnerInfo = `${winner.name} wins ${gameState.pot} (Opponent folded)`;
    gameState.phase = 'showdown';
    broadcastState();
    return;
  }

  // Check if all active players have matched the highest bet and acted
  const allMatched = activePlayers.every(p => p.status === 'all_in' || (p.currentBet === gameState.highestBet && p.hasActed));
  
  if (allMatched) {
    // Pre-flop betting is over. Deal 5 cards and showdown.
    gameState.communityCards = [
      gameState.deck.pop()!,
      gameState.deck.pop()!,
      gameState.deck.pop()!,
      gameState.deck.pop()!,
      gameState.deck.pop()!
    ];
    
    evaluateShowdown();
  } else {
    nextTurn();
  }
}

function evaluateShowdown() {
  gameState.phase = 'showdown';
  const activePlayers = Array.from(players.values()).filter(p => p.seat !== null && p.status !== 'folded');
  
  if (activePlayers.length < 2) return;

  const hands = activePlayers.map(p => {
    const cards = [...p.holeCards, ...gameState.communityCards];
    const solvedHand = Hand.solve(cards);
    return { player: p, hand: solvedHand };
  });

  const winners = Hand.winners(hands.map(h => h.hand));
  const winningHands = hands.filter(h => winners.includes(h.hand));

  const potShare = Math.floor(gameState.pot / winningHands.length);
  
  let winnerText = '';
  winningHands.forEach(wh => {
    wh.player.chips += potShare;
    winnerText += `${wh.player.name} wins ${potShare} with ${wh.hand.descr}. `;
  });

  gameState.winnerInfo = winnerText;
  broadcastState();
}

function startNewHand() {
  try {
    const seatedPlayers = Array.from(players.values()).filter(p => p.seat !== null && p.chips > 0);
    console.log(`startNewHand: seatedPlayers length = ${seatedPlayers.length}`);
    if (seatedPlayers.length < 2) {
      console.log('startNewHand: Not enough seated players with chips.');
      return;
    }

    gameState.phase = 'pre_flop';
    gameState.deck = createDeck();
    gameState.communityCards = [];
    gameState.pot = 0;
    gameState.highestBet = 0;
    gameState.winnerInfo = null;

    const sortedSeated = [...seatedPlayers].sort((a, b) => a.seat! - b.seat!);
    
    // Find current dealer index in sortedSeated
    let currentDealerIndex = sortedSeated.findIndex(p => p.seat === gameState.dealerButton);
    if (currentDealerIndex === -1) currentDealerIndex = 0;
    
    const nextDealerIndex = (currentDealerIndex + 1) % sortedSeated.length;
    gameState.dealerButton = sortedSeated[nextDealerIndex].seat!;
    
    seatedPlayers.forEach(p => {
      p.status = 'playing';
      p.currentBet = 0;
      p.hasActed = false;
      p.holeCards = [gameState.deck.pop()!, gameState.deck.pop()!];
    });

    const sbPlayer = sortedSeated[nextDealerIndex];
    const bbPlayer = sortedSeated[(nextDealerIndex + 1) % sortedSeated.length];

    if (sbPlayer && bbPlayer) {
      const sbAmount = Math.min(sbPlayer.chips, gameState.smallBlind);
      sbPlayer.chips -= sbAmount;
      sbPlayer.currentBet = sbAmount;
      gameState.pot += sbAmount;
      if (sbPlayer.chips === 0) sbPlayer.status = 'all_in';

      const bbAmount = Math.min(bbPlayer.chips, gameState.bigBlind);
      bbPlayer.chips -= bbAmount;
      bbPlayer.currentBet = bbAmount;
      gameState.pot += bbAmount;
      if (bbPlayer.chips === 0) bbPlayer.status = 'all_in';

      gameState.highestBet = gameState.bigBlind;
      gameState.currentTurn = gameState.dealerButton;
    }

    console.log('startNewHand: Hand started successfully. Broadcasting state...');
    broadcastState();
  } catch (error) {
    console.error('Error in startNewHand:', error);
  }
}

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substring(2, 9);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join':
            if (data.role === 'host') {
              // Allow host to reconnect or take over
              if (hostId && players.has(hostId)) {
                const oldHost = players.get(hostId);
                if (oldHost && oldHost.ws !== ws) {
                  players.delete(hostId);
                }
              }
              hostId = id;
              players.set(id, { id, name: 'Host', seat: null, chips: 0, status: 'approved', holeCards: [], currentBet: 0, hasActed: true, ws });
            } else {
              players.set(id, { id, name: data.name || 'Player', seat: null, chips: 0, status: 'waiting_approval', holeCards: [], currentBet: 0, hasActed: false, ws });
            }
            broadcastState();
            break;

          case 'sit':
            const playerToSit = players.get(id);
            if (playerToSit && playerToSit.status === 'waiting_approval') {
              const seatTaken = Array.from(players.values()).some(p => p.seat === data.seat);
              if (!seatTaken && (data.seat === 0 || data.seat === 1)) {
                playerToSit.seat = data.seat;
                playerToSit.chips = data.buyIn;
                broadcastState();
              }
            }
            break;

          case 'approve':
            if (id === hostId) {
              const targetPlayer = players.get(data.playerId);
              if (targetPlayer) {
                if (data.approved) {
                  targetPlayer.status = 'approved';
                } else {
                  targetPlayer.seat = null;
                  targetPlayer.chips = 0;
                  targetPlayer.status = 'waiting_approval';
                }
                broadcastState();
              }
            }
            break;

          case 'start_game':
            console.log(`Received start_game from ${id}. hostId is ${hostId}. Phase is ${gameState.phase}`);
            if (id === hostId && (gameState.phase === 'waiting' || gameState.phase === 'showdown')) {
              console.log('Starting new hand...');
              startNewHand();
            } else {
              console.log('Failed to start new hand. Condition not met.');
            }
            break;

          case 'force_reset':
            if (id === hostId) {
              console.log('Host force reset the hand.');
              gameState.phase = 'waiting';
              gameState.pot = 0;
              gameState.highestBet = 0;
              gameState.communityCards = [];
              gameState.winnerInfo = 'Hand was force-ended by host.';
              Array.from(players.values()).forEach(p => {
                if (p.seat !== null && p.status !== 'waiting_approval') {
                  p.status = 'approved';
                  p.currentBet = 0;
                  p.hasActed = false;
                  p.holeCards = [];
                }
              });
              broadcastState();
            }
            break;

          case 'kick':
            if (id === hostId) {
              const targetPlayer = players.get(data.playerId);
              if (targetPlayer) {
                console.log(`Host kicked player ${targetPlayer.name} (${targetPlayer.id})`);
                targetPlayer.ws.close();
              }
            }
            break;

          case 'action':
            const actionPlayer = players.get(id);
            if (actionPlayer && actionPlayer.seat === gameState.currentTurn && actionPlayer.status === 'playing' && gameState.phase === 'pre_flop') {
              actionPlayer.hasActed = true;
              if (data.action === 'fold') {
                actionPlayer.status = 'folded';
                checkRoundEnd();
              } else if (data.action === 'call') {
                const callAmount = gameState.highestBet - actionPlayer.currentBet;
                const actualCall = Math.min(actionPlayer.chips, callAmount);
                actionPlayer.chips -= actualCall;
                actionPlayer.currentBet += actualCall;
                gameState.pot += actualCall;
                if (actionPlayer.chips === 0) actionPlayer.status = 'all_in';
                checkRoundEnd();
              } else if (data.action === 'raise') {
                const raiseTo = data.amount;
                if (raiseTo > gameState.highestBet && raiseTo <= actionPlayer.chips + actionPlayer.currentBet) {
                  const addAmount = raiseTo - actionPlayer.currentBet;
                  actionPlayer.chips -= addAmount;
                  actionPlayer.currentBet += addAmount;
                  gameState.pot += addAmount;
                  gameState.highestBet = raiseTo;
                  if (actionPlayer.chips === 0) actionPlayer.status = 'all_in';
                  
                  // Other players need to act again
                  Array.from(players.values()).forEach(other => {
                    if (other.seat !== null && other.id !== id && other.status === 'playing') {
                      other.hasActed = false;
                    }
                  });
                  
                  checkRoundEnd();
                }
              }
            }
            break;
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    });

    ws.on('close', () => {
      if (id === hostId) hostId = null;
      players.delete(id);
      
      const seatedPlayers = Array.from(players.values()).filter(p => p.seat !== null);
      if (seatedPlayers.length < 2 && gameState.phase === 'pre_flop') {
        gameState.phase = 'waiting';
        gameState.winnerInfo = 'Not enough players remaining. Game reset.';
      }
      
      broadcastState();
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  server.listen(portNumber, '0.0.0.0', () => {
    console.log(`Server running on port ${portNumber}`);
  });
}

startServer();
