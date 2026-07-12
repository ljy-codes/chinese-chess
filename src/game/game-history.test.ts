import { describe, expect, it } from 'vitest';
import { addGameHistoryRecord, formatDuration, parseGameHistory, serializeGameHistory, type GameHistoryRecord } from './game-history';

const record: GameHistoryRecord = {
  gameId: 'game-1',
  startedAt: 1_700_000_000_000,
  durationSeconds: 3661,
  difficulty: 'normal',
  outcome: 'win',
};

describe('game history storage', () => {
  it('round-trips valid records and rejects damaged storage', () => {
    expect(parseGameHistory(serializeGameHistory([record]))).toEqual([record]);
    expect(parseGameHistory('{broken')).toEqual([]);
    expect(parseGameHistory(JSON.stringify({ version: 2, records: [record] }))).toEqual([]);
  });

  it('stores each completed game once', () => {
    expect(addGameHistoryRecord([record], record)).toEqual([record]);
    expect(addGameHistoryRecord([], record)).toEqual([record]);
  });

  it('formats durations as hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });
});
