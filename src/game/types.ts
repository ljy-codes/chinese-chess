export type Side = 'red' | 'black';
export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';
export type PlayerSidePreference = Side | 'random';
export type AiDifficulty = 'beginner' | 'easy' | 'normal' | 'hard' | 'master';

export interface Position {
  row: number;
  col: number;
}

export interface Piece extends Position {
  id: string;
  side: Side;
  type: PieceType;
}

export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
}

export interface GameStatus {
  kind: 'playing' | 'check' | 'checkmate' | 'stalemate';
  winner?: Side;
}

export interface HistoryEntry {
  pieces: Piece[];
  turn: Side;
  move: Move;
}

export interface GameSettings {
  playerSide: PlayerSidePreference;
  aiDifficulty: AiDifficulty;
}

export interface GameState {
  pieces: Piece[];
  turn: Side;
  selectedId?: string;
  history: HistoryEntry[];
  settings: GameSettings;
  humanSide: Side;
  gameId: string;
  positionVersion: number;
  requestId: string;
}
