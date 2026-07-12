import { describe, expect, it } from 'vitest';
import { getGameResultView, isGameOver } from './game-result';

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
});
