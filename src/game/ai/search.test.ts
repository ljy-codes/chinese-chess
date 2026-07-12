import { describe, expect, it } from 'vitest';
import { createInitialPieces, isLegalMove } from '../chess';
import type { Piece } from '../types';
import { searchBestMove } from './search';
import type { AiSearchRequest } from './types';

const piece = (id: string, side: Piece['side'], type: Piece['type'], row: number, col: number): Piece => ({ id, side, type, row, col });

function request(pieces: Piece[], overrides: Partial<AiSearchRequest> = {}): AiSearchRequest {
  return {
    type: 'search',
    requestId: 'request-test',
    gameId: 'game-test',
    positionVersion: 0,
    pieces,
    side: 'red',
    difficulty: 'normal',
    timeLimitMs: 100,
    maxDepth: 2,
    randomSeed: 42,
    ...overrides,
  };
}

describe('AI search', () => {
  it('always returns a legal move from the initial position', () => {
    const pieces = createInitialPieces();
    const result = searchBestMove(request(pieces, { maxDepth: 1, timeLimitMs: 500 }));
    expect(result.bestMove).not.toBeNull();
    const movingPiece = pieces.find((candidate) => candidate.id === result.bestMove?.piece.id)!;
    expect(isLegalMove(pieces, movingPiece, result.bestMove!.to)).toBe(true);
  });

  it('returns null when the side has no legal move', () => {
    const pieces = [
      piece('bk', 'black', 'king', 0, 4),
      piece('rk', 'red', 'king', 9, 4),
      piece('r1', 'red', 'rook', 1, 4),
      piece('r2', 'red', 'rook', 2, 3),
      piece('r3', 'red', 'rook', 2, 5),
    ];
    const result = searchBestMove(request(pieces, { side: 'black' }));
    expect(result.bestMove).toBeNull();
  });

  it('captures an unprotected high-value piece', () => {
    const pieces = [
      piece('rk', 'red', 'king', 9, 4),
      piece('bk', 'black', 'king', 0, 3),
      piece('rr', 'red', 'rook', 5, 0),
      piece('br', 'black', 'rook', 5, 4),
    ];
    const result = searchBestMove(request(pieces, { maxDepth: 1, timeLimitMs: 500 }));
    expect(result.bestMove?.captured?.id).toBe('br');
  });

  it('is reproducible with a fixed random seed', () => {
    const pieces = createInitialPieces();
    const first = searchBestMove(request(pieces, { difficulty: 'beginner', maxDepth: 1, timeLimitMs: 500 }), () => 0);
    const second = searchBestMove(request(pieces, { difficulty: 'beginner', maxDepth: 1, timeLimitMs: 500 }), () => 0);
    expect(first.bestMove?.piece.id).toBe(second.bestMove?.piece.id);
    expect(first.bestMove?.to).toEqual(second.bestMove?.to);
  });

  it('stops when its injected clock reaches the deadline', () => {
    let time = 0;
    const now = () => time++;
    const result = searchBestMove(request(createInitialPieces(), { timeLimitMs: 2, maxDepth: 8 }), now);
    expect(result.timedOut).toBe(true);
    expect(result.bestMove).not.toBeNull();
    expect(result.elapsedMs).toBeLessThan(20);
  });
});
