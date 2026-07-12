import { describe, expect, it } from 'vitest';
import { AI_DIFFICULTY_CONFIG } from './config';

describe('AI difficulty configuration', () => {
  it('changes real search parameters across difficulty levels', () => {
    const beginner = AI_DIFFICULTY_CONFIG.beginner;
    const master = AI_DIFFICULTY_CONFIG.master;
    expect(master.maxDepth).toBeGreaterThan(beginner.maxDepth);
    expect(master.timeLimitMs).toBeGreaterThan(beginner.timeLimitMs);
    expect(beginner.candidateRange).toBeGreaterThan(master.candidateRange);
    expect(beginner.useTranspositionTable).toBe(false);
    expect(master.useTranspositionTable).toBe(true);
  });
});
