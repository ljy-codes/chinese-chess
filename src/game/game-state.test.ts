import { describe, expect, it } from 'vitest';
import { canHumanMove, createGameState, isCurrentRequest, resolveHumanSide } from './game-state';
import type { GameSettings } from './types';

const humanVsAi: GameSettings = {
  mode: 'human-vs-ai',
  playerSide: 'black',
  aiDifficulty: 'normal',
};

const idFactory = (scope: 'game' | 'request') => `${scope}-fixed`;

describe('game state model', () => {
  it('starts a human-vs-human game with red to move', () => {
    const state = createGameState(undefined, idFactory);
    expect(state.turn).toBe('red');
    expect(state.settings.mode).toBe('human-vs-human');
    expect(state.positionVersion).toBe(0);
    expect(canHumanMove(state)).toBe(true);
  });

  it('marks the opening turn as AI-controlled when the player chooses black', () => {
    const state = createGameState(humanVsAi, idFactory);
    expect(state.humanSide).toBe('black');
    expect(state.turn).toBe('red');
    expect(canHumanMove(state)).toBe(false);
  });

  it('resolves a random side using an injectable random source', () => {
    expect(resolveHumanSide('random', () => 0.1)).toBe('red');
    expect(resolveHumanSide('random', () => 0.9)).toBe('black');
  });

  it('rejects stale request identities', () => {
    const state = createGameState(humanVsAi, idFactory);
    expect(isCurrentRequest(state, state)).toBe(true);
    expect(isCurrentRequest(state, { ...state, positionVersion: 1 })).toBe(false);
    expect(isCurrentRequest(state, { ...state, requestId: 'request-old' })).toBe(false);
    expect(isCurrentRequest(state, { ...state, gameId: 'game-old' })).toBe(false);
  });
});
