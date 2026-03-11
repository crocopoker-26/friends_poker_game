export type PlayerStatus = 'waiting_approval' | 'approved' | 'playing' | 'folded' | 'all_in';

export interface Player {
  id: string;
  name: string;
  seat: number | null;
  chips: number;
  status: PlayerStatus;
  holeCards: string[];
  currentBet: number;
  hasActed: boolean;
}

export type GamePhase = 'waiting' | 'pre_flop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface GameState {
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
