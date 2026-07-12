import { AI_DIFFICULTY_CONFIG } from './ai/config';
import type { AiDifficulty } from './types';

export interface GameHistoryRecord {
  gameId: string;
  startedAt: number;
  durationSeconds: number;
  difficulty: AiDifficulty;
  outcome: 'win' | 'lose';
}

interface StoredGameHistory {
  version: 1;
  records: GameHistoryRecord[];
}

export const GAME_HISTORY_STORAGE_KEY = 'chinese-chess:game-history';
const MAX_HISTORY_RECORDS = 100;

const difficulties = new Set<AiDifficulty>(['beginner', 'easy', 'normal', 'hard', 'master']);

function isGameHistoryRecord(value: unknown): value is GameHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.gameId === 'string'
    && typeof record.startedAt === 'number'
    && Number.isFinite(record.startedAt)
    && typeof record.durationSeconds === 'number'
    && Number.isInteger(record.durationSeconds)
    && record.durationSeconds >= 0
    && typeof record.difficulty === 'string'
    && difficulties.has(record.difficulty as AiDifficulty)
    && (record.outcome === 'win' || record.outcome === 'lose');
}

export function parseGameHistory(value: string | null): GameHistoryRecord[] {
  if (!value) return [];
  try {
    const stored = JSON.parse(value) as Partial<StoredGameHistory>;
    if (stored.version !== 1 || !Array.isArray(stored.records)) return [];
    return stored.records.filter(isGameHistoryRecord).slice(0, MAX_HISTORY_RECORDS);
  } catch {
    return [];
  }
}

export function addGameHistoryRecord(
  records: GameHistoryRecord[],
  record: GameHistoryRecord,
): GameHistoryRecord[] {
  if (records.some((entry) => entry.gameId === record.gameId)) return records;
  return [record, ...records].slice(0, MAX_HISTORY_RECORDS);
}

export function serializeGameHistory(records: GameHistoryRecord[]): string {
  return JSON.stringify({ version: 1, records } satisfies StoredGameHistory);
}

export function formatStartedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function difficultyLabel(difficulty: AiDifficulty): string {
  return AI_DIFFICULTY_CONFIG[difficulty].label;
}
