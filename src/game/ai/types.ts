import type { AiDifficulty, Move, Piece, Side } from '../types';

export interface AiSearchRequest {
  type: 'search';
  requestId: string;
  gameId: string;
  positionVersion: number;
  pieces: Piece[];
  side: Side;
  difficulty: AiDifficulty;
  timeLimitMs: number;
  maxDepth: number;
  randomSeed: number;
}

export interface AiSearchResult {
  type: 'result';
  requestId: string;
  gameId: string;
  positionVersion: number;
  bestMove: Move | null;
  score: number;
  depth: number;
  nodes: number;
  elapsedMs: number;
  principalVariation: Move[];
  timedOut: boolean;
}

export interface AiSearchError {
  type: 'error';
  requestId: string;
  gameId: string;
  positionVersion: number;
  message: string;
}

export type AiWorkerResponse = AiSearchResult | AiSearchError;
