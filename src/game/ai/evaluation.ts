import { isInCheck } from '../chess';
import type { Piece, PieceType, Side } from '../types';

export const MATE_SCORE = 1_000_000;

export const PIECE_VALUES: Record<PieceType, number> = {
  king: 100_000,
  rook: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100,
};

const opposite = (side: Side): Side => side === 'red' ? 'black' : 'red';

function positionalValue(piece: Piece): number {
  const centerDistance = Math.abs(piece.col - 4);
  const centerBonus = Math.max(0, 4 - centerDistance);

  switch (piece.type) {
    case 'pawn': {
      const progress = piece.side === 'red' ? 6 - piece.row : piece.row - 3;
      const crossed = piece.side === 'red' ? piece.row <= 4 : piece.row >= 5;
      return Math.max(0, progress) * 8 + (crossed ? 35 + centerBonus * 4 : 0);
    }
    case 'horse':
      return centerBonus * 8;
    case 'cannon':
      return centerBonus * 4;
    case 'rook':
      return centerBonus * 2;
    case 'king':
    case 'advisor':
    case 'elephant':
      return 0;
  }
}

function activityValue(piece: Piece): number {
  const centerDistance = Math.abs(piece.col - 4);
  switch (piece.type) {
    case 'rook':
      return 16 - centerDistance * 2;
    case 'cannon':
      return 14 - centerDistance * 2;
    case 'horse':
      return 18 - centerDistance * 3 - (piece.row === 0 || piece.row === 9 ? 5 : 0);
    case 'pawn':
      return piece.side === 'red' ? Math.max(0, 6 - piece.row) * 3 : Math.max(0, piece.row - 3) * 3;
    case 'king':
    case 'advisor':
    case 'elephant':
      return 0;
  }
}

export function evaluatePosition(pieces: Piece[], side: Side): number {
  let score = 0;
  for (const piece of pieces) {
    const value = PIECE_VALUES[piece.type] + positionalValue(piece) + activityValue(piece);
    score += piece.side === side ? value : -value;
  }
  if (isInCheck(pieces, side)) score -= 45;
  if (isInCheck(pieces, opposite(side))) score += 45;
  return score;
}
