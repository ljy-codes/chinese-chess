import type { AiDifficulty } from '../types';

export interface AiDifficultyConfig {
  label: string;
  maxDepth: number;
  timeLimitMs: number;
  candidateRange: number;
  useAdvancedOrdering: boolean;
  useTranspositionTable: boolean;
}

export const AI_DIFFICULTY_CONFIG: Record<AiDifficulty, AiDifficultyConfig> = {
  beginner: {
    label: '入门',
    maxDepth: 2,
    timeLimitMs: 100,
    candidateRange: 5,
    useAdvancedOrdering: false,
    useTranspositionTable: false,
  },
  easy: {
    label: '简单',
    maxDepth: 2,
    timeLimitMs: 300,
    candidateRange: 3,
    useAdvancedOrdering: false,
    useTranspositionTable: false,
  },
  normal: {
    label: '普通',
    maxDepth: 4,
    timeLimitMs: 800,
    candidateRange: 1,
    useAdvancedOrdering: true,
    useTranspositionTable: false,
  },
  hard: {
    label: '困难',
    maxDepth: 6,
    timeLimitMs: 2000,
    candidateRange: 1,
    useAdvancedOrdering: true,
    useTranspositionTable: true,
  },
  master: {
    label: '大师',
    maxDepth: 8,
    timeLimitMs: 4000,
    candidateRange: 1,
    useAdvancedOrdering: true,
    useTranspositionTable: true,
  },
};
