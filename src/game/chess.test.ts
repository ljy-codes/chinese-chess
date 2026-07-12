import { describe, expect, it } from 'vitest';
import { createInitialPieces, getGameStatus, getLegalMoves, isInCheck, isLegalMove } from './chess';
import type { Piece } from './types';

const piece = (id: string, side: Piece['side'], type: Piece['type'], row: number, col: number): Piece => ({ id, side, type, row, col });

describe('Chinese chess rules', () => {
  it('creates the standard 32-piece opening', () => {
    const pieces = createInitialPieces();
    expect(pieces).toHaveLength(32);
    expect(getGameStatus(pieces, 'red')).toEqual({ kind: 'playing' });
  });

  it('blocks a horse when its leg is occupied', () => {
    const horse = piece('h', 'red', 'horse', 9, 1);
    const blocker = piece('p', 'red', 'pawn', 8, 1);
    const kings = [piece('rk', 'red', 'king', 9, 4), piece('bk', 'black', 'king', 0, 3)];
    expect(isLegalMove([...kings, horse, blocker], horse, { row: 7, col: 2 })).toBe(false);
    expect(isLegalMove([...kings, horse], horse, { row: 7, col: 2 })).toBe(true);
  });

  it('requires exactly one screen for a cannon capture', () => {
    const cannon = piece('c', 'red', 'cannon', 7, 1);
    const screen = piece('s', 'red', 'pawn', 5, 1);
    const target = piece('t', 'black', 'rook', 2, 1);
    const kings = [piece('rk', 'red', 'king', 9, 4), piece('bk', 'black', 'king', 0, 3)];
    expect(isLegalMove([...kings, cannon, screen, target], cannon, target)).toBe(true);
    expect(isLegalMove([...kings, cannon, target], cannon, target)).toBe(false);
  });

  it('allows sideways pawn movement only after crossing the river', () => {
    const kings = [piece('rk', 'red', 'king', 9, 4), piece('bk', 'black', 'king', 0, 3)];
    const before = piece('p1', 'red', 'pawn', 6, 2);
    const after = piece('p2', 'red', 'pawn', 4, 2);
    expect(isLegalMove([...kings, before], before, { row: 6, col: 3 })).toBe(false);
    expect(isLegalMove([...kings, after], after, { row: 4, col: 3 })).toBe(true);
    expect(isLegalMove([...kings, after], after, { row: 5, col: 2 })).toBe(false);
  });

  it('prevents exposing facing kings', () => {
    const redKing = piece('rk', 'red', 'king', 9, 4);
    const blackKing = piece('bk', 'black', 'king', 0, 4);
    const blocker = piece('r', 'red', 'rook', 5, 4);
    expect(isLegalMove([redKing, blackKing, blocker], blocker, { row: 5, col: 3 })).toBe(false);
    expect(isInCheck([redKing, blackKing], 'red')).toBe(true);
  });

  it('reports checkmate when the checked king has no legal move', () => {
    const pieces = [
      piece('bk', 'black', 'king', 0, 4),
      piece('rk', 'red', 'king', 9, 4),
      piece('r1', 'red', 'rook', 1, 4),
      piece('r2', 'red', 'rook', 2, 3),
      piece('r3', 'red', 'rook', 2, 5),
    ];
    expect(getLegalMoves(pieces, pieces[0])).toHaveLength(0);
    expect(getGameStatus(pieces, 'black')).toEqual({ kind: 'checkmate', winner: 'red' });
  });
});
