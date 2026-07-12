import { describe, expect, it } from 'vitest';
import { getCheckedKingId, getGameResultView, isGameOver } from './game-result';
import type { Piece } from './types';

describe('game result view', () => {
  it('reports a player victory', () => {
    const status = { kind: 'checkmate' as const, winner: 'red' as const };
    expect(isGameOver(status)).toBe(true);
    expect(getGameResultView(status, 'red')).toEqual({ outcome: 'win', title: '红方胜', detail: '黑方负 · 将死' });
  });

  it('reports a player loss without leaving an AI turn active', () => {
    const status = { kind: 'stalemate' as const, winner: 'black' as const };
    expect(getGameResultView(status, 'red')).toEqual({ outcome: 'lose', title: '黑方胜', detail: '红方负 · 困毙' });
  });

  it('returns no result while the game continues', () => {
    expect(isGameOver({ kind: 'check' })).toBe(false);
    expect(getGameResultView({ kind: 'playing' }, 'red')).toBeNull();
  });

  it('identifies only the checked side king for visual warning', () => {
    const pieces: Piece[] = [
      { id: 'red-king', side: 'red', type: 'king', row: 9, col: 4 },
      { id: 'black-king', side: 'black', type: 'king', row: 0, col: 4 },
    ];
    expect(getCheckedKingId({ kind: 'check' }, pieces, 'black')).toBe('black-king');
    expect(getCheckedKingId({ kind: 'playing' }, pieces, 'black')).toBeUndefined();
    expect(getCheckedKingId({ kind: 'checkmate', winner: 'red' }, pieces, 'black')).toBeUndefined();
  });
});
