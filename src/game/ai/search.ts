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
}

interface NodeResult {
  score: number;
  line: Move[];
}

const opposite = (side: Side): Side => side === 'red' ? 'black' : 'red';
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

function hasLegalMove(pieces: Piece[], side: Side): boolean {
  return pieces.some((piece) => piece.side === side && getLegalMoves(pieces, piece).length > 0);
}

function moveScore(candidate: SearchMove, side: Side): number {
  let score = candidate.move.captured
    ? PIECE_VALUES[candidate.move.captured.type] * 10 - PIECE_VALUES[candidate.move.piece.type]
    : 0;
  if (isInCheck(candidate.pieces, opposite(side))) score += 5_000;
  return score;
}

function orderedMoves(pieces: Piece[], side: Side): SearchMove[] {
  return generateLegalSearchMoves(pieces, side)
    .sort((a, b) => moveScore(b, side) - moveScore(a, side));
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
  if (depth === 0) {
    if (!hasLegalMove(pieces, side)) {
      return { score: isInCheck(pieces, side) ? -MATE_SCORE + ply : -MATE_SCORE / 2 + ply, line: [] };
    }
    return { score: evaluatePosition(pieces, side), line: [] };
  }

  const moves = orderedMoves(pieces, side);
  if (moves.length === 0) {
    return { score: isInCheck(pieces, side) ? -MATE_SCORE + ply : -MATE_SCORE / 2 + ply, line: [] };
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
  };
  const rootMoves = orderedMoves(request.pieces, request.side);
  if (rootMoves.length === 0) {
    return {
      type: 'result',
      requestId: request.requestId,
      gameId: request.gameId,
      positionVersion: request.positionVersion,
      bestMove: null,
      score: isInCheck(request.pieces, request.side) ? -MATE_SCORE : -MATE_SCORE / 2,
      depth: 0,
      nodes: context.nodes,
      elapsedMs: now() - startedAt,
      principalVariation: [],
      timedOut: false,
    };
  }

  let bestLine = [rootMoves[0].move];
  let bestScore = -Infinity;
  let completedDepth = 0;
  const completedCandidates: { move: Move; score: number; line: Move[] }[] = [];

  for (let depth = 1; depth <= request.maxDepth; depth += 1) {
    const iteration: { move: Move; score: number; line: Move[] }[] = [];
    rootMoves.sort((a, b) => Number(sameMove(bestLine[0], b.move)) - Number(sameMove(bestLine[0], a.move)));
    for (const candidate of rootMoves) {
      if (now() >= context.deadline) {
        context.timedOut = true;
        break;
      }
      const child = negamax(candidate.pieces, opposite(request.side), depth - 1, 1, -Infinity, Infinity, context);
      if (context.timedOut) break;
      const score = -child.score;
      iteration.push({ move: candidate.move, score, line: [candidate.move, ...child.line] });
    }
    if (context.timedOut || iteration.length !== rootMoves.length) break;
    iteration.sort((a, b) => b.score - a.score);
    completedCandidates.splice(0, completedCandidates.length, ...iteration);
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
