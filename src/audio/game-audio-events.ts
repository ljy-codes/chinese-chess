import type { HistoryEntry } from '../game/types';

export type GameAudioEvent = 'move' | 'capture' | 'gameEnd';

export interface GameAudioSnapshot {
  gameId: string;
  gameOver: boolean;
  history: HistoryEntry[];
}

export function deriveGameAudioEvents(previous: GameAudioSnapshot, current: GameAudioSnapshot): GameAudioEvent[] {
  if (previous.gameId !== current.gameId || current.history.length <= previous.history.length) return [];

  const events: GameAudioEvent[] = current.history
    .slice(previous.history.length)
    .map(({ move }) => move.captured ? 'capture' : 'move');
  if (!previous.gameOver && current.gameOver) events.push('gameEnd');
  return events;
}
