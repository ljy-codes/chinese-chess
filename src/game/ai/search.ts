import { isInCheck, makeMove, getLegalMoves } from '../chess';
import type { Move, Piece, Side } from '../types';
import { AI_DIFFICULTY_CONFIG } from './config';
import { evaluatePosition, MATE_SCORE, PIECE_VALUES } from './evaluation';
import type { AiSearchRequest, AiSearchResult } from './types';

interface SearchMove {
  move: Move;
  pieces: Piece[];
}

interface SearchContext {
  deadline: number;
  nodes: number;
  now: () => number;
  timedOut: boolean;
  transpositionTable?: Map<string, TranspositionEntry>;
}

interface TranspositionEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  bestMove?: Move;
}

interface NodeResult {
  score: number;
  line: Move[];
}

const opposite = (side: Side): Side => side === 'red' ? 'black' : 'red';
const MATE_THRESHOLD = MATE_SCORE - 10_000;
const scoreForTable = (score: number, ply: number) => score > MATE_THRESHOLD ? score + ply : score < -MATE_THRESHOLD ? score - ply : score;
const scoreFromTable = (score: number, ply: number) => score > MATE_THRESHOLD ? score - ply : score < -MATE_THRESHOLD ? score + ply : score;
const sameMove = (a: Move | undefined, b: Move) => Boolean(a
  && a.piece.id === b.piece.id
  && a.to.row === b.to.row
  && a.to.col === b.to.col);

export function generateLegalSearchMoves(pieces: Piece[], side: Side): SearchMove[] {
  const moves: SearchMove[] = [];
  for (const piece of pieces) {
    if (piece.side !== side) continue;
    for (const to of getLegalMoves(pieces, piece)) {
      const result = makeMove(pieces, piece, to);
      moves.push(result);
    }
  }
  return moves;
}

function moveScore(candidate: SearchMove, side: Side): number {
  let score = candidate.move.captured
    ? PIECE_VALUES[candidate.move.captured.type] * 10 - PIECE_VALUES[candidate.move.piece.type]
    : 0;
  if (isInCheck(candidate.pieces, opposite(side))) score += 5_000;
  return score;
}

function positionKey(pieces: Piece[], side: Side): string {
  return `${side}|${pieces.map((piece) => `${piece.side[0]}${piece.type[0]}${piece.row}${piece.col}`).sort().join('|')}`;
}

function orderedMoves(pieces: Piece[], side: Side, preferredMove?: Move): SearchMove[] {
  return generateLegalSearchMoves(pieces, side)
    .sort((a, b) => Number(sameMove(preferredMove, b.move)) - Number(sameMove(preferredMove, a.move))
      || moveScore(b, side) - moveScore(a, side));
}

function quiescence(
  pieces: Piece[],
  side: Side,
  ply: number,
  alpha: number,
  beta: number,
  context: SearchContext,
  remainingPly = 6,
): NodeResult {
  context.nodes += 1;
  if (context.now() >= context.deadline) {
    context.timedOut = true;
    return { score: evaluatePosition(pieces, side), line: [] };
  }
  if (!pieces.some((piece) => piece.side === side && piece.type === 'king')) {
    return { score: -MATE_SCORE + ply, line: [] };
  }

  const checked = isInCheck(pieces, side);
  const standPat = evaluatePosition(pieces, side);
  if (!checked) {
    if (standPat >= beta) return { score: standPat, line: [] };
    alpha = Math.max(alpha, standPat);
  }

  const allMoves = orderedMoves(pieces, side);
  if (allMoves.length === 0) return { score: -MATE_SCORE + ply, line: [] };
  if (remainingPly <= 0) return { score: standPat, line: [] };
  const moves = allMoves.filter((candidate) => checked || candidate.move.captured);
  if (moves.length === 0) {
    return { score: alpha, line: [] };
  }
  let bestLine: Move[] = [];
  for (const candidate of moves) {
    const child = quiescence(candidate.pieces, opposite(side), ply + 1, -beta, -alpha, context, remainingPly - 1);
    if (context.timedOut) return { score: alpha, line: bestLine };
    const score = -child.score;
    if (score > alpha) {
      alpha = score;
      bestLine = [candidate.move, ...child.line];
    }
    if (alpha >= beta) break;
  }
  return { score: alpha, line: bestLine };
}

function negamax(
  pieces: Piece[],
  side: Side,
  depth: number,
  ply: number,
  alpha: number,
  beta: number,
  context: SearchContext,
): NodeResult {
  context.nodes += 1;
  if (context.now() >= context.deadline) {
    context.timedOut = true;
    return { score: evaluatePosition(pieces, side), line: [] };
  }
  const kingExists = pieces.some((piece) => piece.side === side && piece.type === 'king');
  if (!kingExists) return { score: -MATE_SCORE + ply, line: [] };
  if (depth === 0) return quiescence(pieces, side, ply, alpha, beta, context);

  const key = context.transpositionTable ? positionKey(pieces, side) : '';
  const entry = context.transpositionTable?.get(key);
  if (entry && entry.depth >= depth) {
    const score = scoreFromTable(entry.score, ply);
    if (entry.flag === 'exact') return { score, line: entry.bestMove ? [entry.bestMove] : [] };
    if (entry.flag === 'lower') alpha = Math.max(alpha, score);
    else beta = Math.min(beta, score);
    if (alpha >= beta) return { score, line: entry.bestMove ? [entry.bestMove] : [] };
  }
  const originalAlpha = alpha;
  const originalBeta = beta;
  const moves = orderedMoves(pieces, side, entry?.bestMove);
  if (moves.length === 0) {
    return { score: -MATE_SCORE + ply, line: [] };
  }
  let bestScore = -Infinity;
  let bestLine: Move[] = [];
  for (const candidate of moves) {
    const child = negamax(candidate.pieces, opposite(side), depth - 1, ply + 1, -beta, -alpha, context);
    if (context.timedOut) return { score: bestScore, line: bestLine };
    const score = -child.score;
    if (score > bestScore) {
      bestScore = score;
      bestLine = [candidate.move, ...child.line];
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  if (context.transpositionTable && !context.timedOut) {
    if (context.transpositionTable.size >= 50_000) context.transpositionTable.clear();
    context.transpositionTable.set(key, {
      depth,
      score: scoreForTable(bestScore, ply),
      flag: bestScore <= originalAlpha ? 'upper' : bestScore >= originalBeta ? 'lower' : 'exact',
      bestMove: bestLine[0],
    });
  }
  return { score: bestScore, line: bestLine };
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

export function searchBestMove(request: AiSearchRequest, now: () => number = () => performance.now()): AiSearchResult {
  const startedAt = now();
  const context: SearchContext = {
    deadline: startedAt + Math.max(1, request.timeLimitMs),
    nodes: 0,
    now,
    timedOut: false,
    transpositionTable: AI_DIFFICULTY_CONFIG[request.difficulty].useTranspositionTable ? new Map() : undefined,
  };
  const rootMoves = orderedMoves(request.pieces, request.side);
  if (rootMoves.length === 0) {
    return {
      type: 'result',
      requestId: request.requestId,
      gameId: request.gameId,
      positionVersion: request.positionVersion,
      bestMove: null,
      score: -MATE_SCORE,
      depth: 0,
      nodes: context.nodes,
      elapsedMs: now() - startedAt,
      principalVariation: [],
      timedOut: false,
    };
  }

  let bestLine = [rootMoves[0].move];
  let bestScore = evaluatePosition(rootMoves[0].pieces, request.side);
  let completedDepth = 0;
  const completedCandidates: { move: Move; score: number; line: Move[] }[] = [];

  for (let depth = 1; depth <= request.maxDepth; depth += 1) {
    const iteration: { move: Move; score: number; line: Move[] }[] = [];
    let alpha = -Infinity;
    rootMoves.sort((a, b) => Number(sameMove(bestLine[0], b.move)) - Number(sameMove(bestLine[0], a.move)));
    for (const candidate of rootMoves) {
      if (now() >= context.deadline) {
        context.timedOut = true;
        break;
      }
      const child = negamax(candidate.pieces, opposite(request.side), depth - 1, 1, -Infinity, -alpha, context);
      if (context.timedOut) break;
      const score = -child.score;
      iteration.push({ move: candidate.move, score, line: [candidate.move, ...child.line] });
      alpha = Math.max(alpha, score);
    }
    if (context.timedOut || iteration.length !== rootMoves.length) break;
    iteration.sort((a, b) => b.score - a.score);
    completedCandidates.splice(0, completedCandidates.length, ...iteration);
    rootMoves.sort((a, b) => iteration.findIndex(({ move }) => sameMove(move, a.move)) - iteration.findIndex(({ move }) => sameMove(move, b.move)));
    bestLine = iteration[0].line;
    bestScore = iteration[0].score;
    completedDepth = depth;
    if (Math.abs(bestScore) >= MATE_SCORE - 100) break;
  }

  const config = AI_DIFFICULTY_CONFIG[request.difficulty];
  const candidatePool = completedCandidates.length > 0
    ? completedCandidates.slice(0, config.candidateRange)
    : [{ move: rootMoves[0].move, score: bestScore, line: bestLine }];
  const selected = candidatePool[Math.floor(seededRandom(request.randomSeed)() * candidatePool.length)];

  return {
    type: 'result',
    requestId: request.requestId,
    gameId: request.gameId,
    positionVersion: request.positionVersion,
    bestMove: selected.move,
    score: selected.score,
    depth: completedDepth,
    nodes: context.nodes,
    elapsedMs: now() - startedAt,
    principalVariation: selected.line,
    timedOut: context.timedOut,
  };
}
