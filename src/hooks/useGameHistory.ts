import { useEffect } from 'react';
import {
  addGameHistoryRecord,
  GAME_HISTORY_STORAGE_KEY,
  parseGameHistory,
  serializeGameHistory,
  type GameHistoryRecord,
} from '../game/game-history';
import type { AiDifficulty } from '../game/types';

interface CompletedGame {
  gameId: string;
  startedAt: number;
  difficulty: AiDifficulty;
  outcome?: 'win' | 'lose';
}

function loadRecords(): GameHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseGameHistory(window.localStorage.getItem(GAME_HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function useGameHistory(game: CompletedGame) {
  useEffect(() => {
    if (!game.outcome) return;
    const storedRecords = loadRecords();
    const nextRecords = addGameHistoryRecord(storedRecords, {
      gameId: game.gameId,
      startedAt: game.startedAt,
      durationSeconds: Math.max(0, Math.floor((Date.now() - game.startedAt) / 1000)),
      difficulty: game.difficulty,
      outcome: game.outcome,
    });
    if (nextRecords !== storedRecords) {
      try {
        window.localStorage.setItem(GAME_HISTORY_STORAGE_KEY, serializeGameHistory(nextRecords));
      } catch {
        // Storage can be unavailable in privacy modes; the active game remains unaffected.
      }
    }
  }, [game.difficulty, game.gameId, game.outcome, game.startedAt]);

  return loadRecords();
}
