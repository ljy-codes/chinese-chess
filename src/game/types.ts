export type Side = 'red' | 'black';
export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';

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
