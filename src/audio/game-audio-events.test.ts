import { describe, expect, it } from 'vitest';
import type { HistoryEntry, Piece } from '../game/types';
import { deriveGameAudioEvents, type GameAudioSnapshot } from './game-audio-events';

const rook: Piece = { id: 'rook', side: 'red', type: 'rook', row: 9, col: 0 };
const captured: Piece = { id: 'pawn', side: 'black', type: 'pawn', row: 8, col: 0 };

function entry(target?: Piece): HistoryEntry {
  return {
    pieces: [rook],
    turn: 'red',
    move: { piece: rook, from: { row: 9, col: 0 }, to: { row: 8, col: 0 }, captured: target },
  };
}

const snapshot = (history: HistoryEntry[], gameOver = false, gameId = 'game'): GameAudioSnapshot => ({ gameId, gameOver, history });

describe('game audio events', () => {
  it('distinguishes moves, captures and terminal transitions', () => {
    expect(deriveGameAudioEvents(snapshot([]), snapshot([entry()]))).toEqual(['move']);
    expect(deriveGameAudioEvents(snapshot([]), snapshot([entry(captured)]))).toEqual(['capture']);
    expect(deriveGameAudioEvents(snapshot([]), snapshot([entry(captured)], true))).toEqual(['capture', 'gameEnd']);
  });

  it('does not sound for undo or restart', () => {
    expect(deriveGameAudioEvents(snapshot([entry()]), snapshot([]))).toEqual([]);
    expect(deriveGameAudioEvents(snapshot([entry()]), snapshot([], false, 'new-game'))).toEqual([]);
  });
});
