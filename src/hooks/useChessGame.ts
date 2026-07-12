import { useMemo, useState } from 'react';
import { getGameStatus, getLegalMoves, isLegalMove, makeMove } from '../game/chess';
import { AI_DIFFICULTY_CONFIG } from '../game/ai/config';
import type { AiSearchRequest, AiSearchResult } from '../game/ai/types';
import { canHumanMove, createGameState, createId, isCurrentRequest } from '../game/game-state';
import type { GameSettings, Piece, Position } from '../game/types';
import { useChessAi } from './useChessAi';

export const positionKey = ({ row, col }: Position) => `${row}-${col}`;

export function useChessGame() {
  const [game, setGame] = useState(createGameState);
  const { pieces, turn, selectedId, history } = game;

  const status = useMemo(() => getGameStatus(pieces, turn), [pieces, turn]);
  const selected = useMemo(
    () => pieces.find((piece) => piece.id === selectedId),
    [pieces, selectedId],
  );
  const legalMoves = useMemo(
    () => selected ? getLegalMoves(pieces, selected) : [],
    [pieces, selected],
  );
  const legalMoveKeys = useMemo(
    () => new Set(legalMoves.map(positionKey)),
    [legalMoves],
  );
  const boardIndex = useMemo(
    () => new Map(pieces.map((piece) => [positionKey(piece), piece])),
    [pieces],
  );
  const lastMove = history.at(-1)?.move;
  const isAiTurn = game.settings.mode === 'human-vs-ai' && !canHumanMove(game);
  const aiConfig = AI_DIFFICULTY_CONFIG[game.settings.aiDifficulty];
  const aiRequest = useMemo<AiSearchRequest | null>(() => {
    if (!isAiTurn || status.kind === 'checkmate' || status.kind === 'stalemate') return null;
    return {
      type: 'search',
      requestId: game.requestId,
      gameId: game.gameId,
      positionVersion: game.positionVersion,
      pieces: game.pieces,
      side: game.turn,
      difficulty: game.settings.aiDifficulty,
      timeLimitMs: aiConfig.timeLimitMs,
      maxDepth: aiConfig.maxDepth,
      randomSeed: game.positionVersion + game.history.length * 97,
    };
  }, [aiConfig.maxDepth, aiConfig.timeLimitMs, game, isAiTurn, status.kind]);

  function applyAiResult(result: AiSearchResult) {
    setGame((current) => {
      if (!isCurrentRequest(current, result) || current.settings.mode !== 'human-vs-ai' || !result.bestMove) {
        return current;
      }
      const piece = current.pieces.find((candidate) => candidate.id === result.bestMove?.piece.id);
      if (!piece || piece.side !== current.turn || !isLegalMove(current.pieces, piece, result.bestMove.to)) {
        return current;
      }
      const moved = makeMove(current.pieces, piece, result.bestMove.to);
      return {
        ...current,
        pieces: moved.pieces,
        turn: current.turn === 'red' ? 'black' : 'red',
        selectedId: undefined,
        history: [...current.history, { pieces: current.pieces, turn: current.turn, move: moved.move }],
        positionVersion: current.positionVersion + 1,
        requestId: createId('request'),
      };
    });
  }

  const ai = useChessAi(aiRequest, applyAiResult);

  function selectPosition(position: Position) {
    if (status.kind === 'checkmate' || status.kind === 'stalemate' || !canHumanMove(game)) return;

    const clicked = boardIndex.get(positionKey(position));
    if (clicked?.side === turn) {
      setGame((current) => ({ ...current, selectedId: clicked.id }));
      return;
    }
    if (!selected || !legalMoveKeys.has(positionKey(position))) {
      setGame((current) => ({ ...current, selectedId: undefined }));
      return;
    }

    const result = makeMove(pieces, selected, position);
    setGame((current) => ({
      ...current,
      pieces: result.pieces,
      turn: turn === 'red' ? 'black' : 'red',
      selectedId: undefined,
      history: [...current.history, { pieces, turn, move: result.move }],
      positionVersion: current.positionVersion + 1,
      requestId: createId('request'),
    }));
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setGame((current) => ({
      ...current,
      pieces: previous.pieces,
      turn: previous.turn,
      history: current.history.slice(0, -1),
      selectedId: undefined,
      positionVersion: current.positionVersion + 1,
      requestId: createId('request'),
    }));
  }

  function restart() {
    setGame((current) => createGameState(current.settings));
  }

  function updateSettings(settings: GameSettings) {
    setGame(createGameState(settings));
  }

  function retryAi() {
    setGame((current) => ({ ...current, requestId: createId('request') }));
  }

  return {
    boardIndex,
    gameId: game.gameId,
    humanSide: game.humanSide,
    history,
    isAiTurn,
    aiError: ai.error,
    aiStats: ai.stats,
    isAiThinking: ai.isThinking,
    lastMove,
    legalMoveKeys,
    pieces,
    positionVersion: game.positionVersion,
    requestId: game.requestId,
    restart,
    retryAi,
    selectedId,
    selectPosition,
    settings: game.settings,
    status,
    turn,
    undo,
    updateSettings,
  };
}

export type ChessGame = ReturnType<typeof useChessGame>;
export type BoardIndex = Map<string, Piece>;
