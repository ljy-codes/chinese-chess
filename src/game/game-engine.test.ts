import { describe, expect, it } from 'vitest';
import type { AiSearchResult } from './ai/types';
import { applyAiSearchResult, canUndoHumanTurn, movePiece, undoHumanTurn } from './game-engine';
import { createGameState } from './game-state';
import type { GameSettings, GameState } from './types';

const playerBlack: GameSettings = { playerSide: 'black', aiDifficulty: 'normal' };

function aiResult(state: GameState, pieceId: string, row: number, col: number): AiSearchResult {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId)!;
  return {
    type: 'result',
    requestId: state.requestId,
    gameId: state.gameId,
    positionVersion: state.positionVersion,
    bestMove: { piece, from: { row: piece.row, col: piece.col }, to: { row, col } },
    score: 0,
    depth: 1,
    nodes: 1,
    elapsedMs: 1,
    principalVariation: [],
    timedOut: false,
  };
}

describe('human-vs-AI game transitions', () => {
  it('undoes only the player move while AI is thinking', () => {
    const initial = createGameState();
    const afterPlayer = movePiece(initial, 'red-pawn-0', { row: 5, col: 0 }, 'request-2')!;
    const undone = undoHumanTurn(afterPlayer, 'request-3');
    expect(undone.pieces).toEqual(initial.pieces);
    expect(undone.turn).toBe('red');
    expect(undone.history).toHaveLength(0);
  });

  it('undoes both player and AI moves after AI replies', () => {
    const initial = createGameState();
    const afterPlayer = movePiece(initial, 'red-pawn-0', { row: 5, col: 0 }, 'request-2')!;
    const afterAi = applyAiSearchResult(afterPlayer, aiResult(afterPlayer, 'black-pawn-0', 4, 0), 'request-3');
    const undone = undoHumanTurn(afterAi, 'request-4');
    expect(undone.pieces).toEqual(initial.pieces);
    expect(undone.turn).toBe('red');
    expect(undone.history).toHaveLength(0);
  });

  it('does not undo the AI opening before a player-black move', () => {
    const initial = createGameState(playerBlack);
    const afterAi = applyAiSearchResult(initial, aiResult(initial, 'red-pawn-0', 5, 0), 'request-2');
    expect(canUndoHumanTurn(afterAi)).toBe(false);
    expect(undoHumanTurn(afterAi, 'request-3')).toBe(afterAi);
  });

  it('rejects an AI result from an old request', () => {
    const state = createGameState(playerBlack);
    const stale = { ...aiResult(state, 'red-pawn-0', 5, 0), requestId: 'request-old' };
    expect(applyAiSearchResult(state, stale, 'request-2')).toBe(state);
  });
});
