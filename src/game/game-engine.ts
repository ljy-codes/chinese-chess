import { isLegalMove, makeMove } from './chess';
import { isCurrentRequest } from './game-state';
import type { AiSearchResult } from './ai/types';
import type { GameState, Position } from './types';

const opposite = (side: GameState['turn']): GameState['turn'] => side === 'red' ? 'black' : 'red';

export function movePiece(
  state: GameState,
  pieceId: string,
  to: Position,
  nextRequestId: string,
): GameState | null {
  const piece = state.pieces.find((candidate) => candidate.id === pieceId);
  if (!piece || piece.side !== state.turn || !isLegalMove(state.pieces, piece, to)) return null;

  const result = makeMove(state.pieces, piece, to);
  return {
    ...state,
    pieces: result.pieces,
    turn: opposite(state.turn),
    selectedId: undefined,
    history: [...state.history, { pieces: state.pieces, turn: state.turn, move: result.move }],
    positionVersion: state.positionVersion + 1,
    requestId: nextRequestId,
  };
}

export function applyAiSearchResult(
  state: GameState,
  result: AiSearchResult,
  nextRequestId: string,
): GameState {
  if (!isCurrentRequest(state, result) || state.turn === state.humanSide || !result.bestMove) return state;
  return movePiece(state, result.bestMove.piece.id, result.bestMove.to, nextRequestId) ?? state;
}

export function undoHumanTurn(state: GameState, nextRequestId: string): GameState {
  let targetIndex = -1;
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    if (state.history[index].move.piece.side === state.humanSide) {
      targetIndex = index;
      break;
    }
  }
  if (targetIndex < 0) return state;

  const target = state.history[targetIndex];
  return {
    ...state,
    pieces: target.pieces,
    turn: target.turn,
    history: state.history.slice(0, targetIndex),
    selectedId: undefined,
    positionVersion: state.positionVersion + 1,
    requestId: nextRequestId,
  };
}

export function canUndoHumanTurn(state: GameState): boolean {
  return state.history.some((entry) => entry.move.piece.side === state.humanSide);
}
