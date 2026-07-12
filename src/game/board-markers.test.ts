import { describe, expect, it } from 'vitest';
import { getMoveMarkers, getRecentMoves } from './board-markers';
import type { HistoryEntry, Move, Piece, Side } from './types';

const piece = (id: string, side: Side): Piece => ({ id, side, type: 'rook', row: side === 'red' ? 9 : 0, col: 0 });
const entry = (side: Side, fromRow: number, toRow: number): HistoryEntry => {
  const movingPiece = piece(`${side}-${fromRow}-${toRow}`, side);
  const move: Move = { piece: movingPiece, from: { row: fromRow, col: 0 }, to: { row: toRow, col: 0 } };
  return { pieces: [movingPiece], turn: side, move };
};

describe('board move markers', () => {
  it('keeps the latest move for both red and black', () => {
    const history = [entry('red', 9, 8), entry('black', 0, 1), entry('red', 8, 7)];
    const recent = getRecentMoves(history);
    expect(recent.red?.from.row).toBe(8);
    expect(recent.red?.to.row).toBe(7);
    expect(recent.black?.from.row).toBe(0);
    expect(recent.black?.to.row).toBe(1);
  });

  it('distinguishes move origins and destinations by side', () => {
    const recent = getRecentMoves([entry('red', 9, 8), entry('black', 0, 1)]);
    expect(getMoveMarkers({ row: 9, col: 0 }, recent)).toEqual([{ side: 'red', endpoint: 'from' }]);
    expect(getMoveMarkers({ row: 1, col: 0 }, recent)).toEqual([{ side: 'black', endpoint: 'to' }]);
  });
});
