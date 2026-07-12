import { useMemo, useState } from 'react';
import { getGameStatus, getLegalMoves } from '../game/chess';
import { AI_DIFFICULTY_CONFIG } from '../game/ai/config';
import type { AiSearchRequest, AiSearchResult } from '../game/ai/types';
import { getRecentMoves } from '../game/board-markers';
import { applyAiSearchResult, canUndoHumanTurn, movePiece, undoHumanTurn } from '../game/game-engine';
import { getGameResultView, isGameOver } from '../game/game-result';
import { canHumanMove, createGameState, createId } from '../game/game-state';
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
  const recentMoves = useMemo(() => getRecentMoves(history), [history]);
  const gameOver = isGameOver(status);
  const resultView = getGameResultView(status, game.humanSide);
  const isAiTurn = !gameOver && !canHumanMove(game);
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
    setGame((current) => applyAiSearchResult(current, result, createId('request')));
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

    setGame((current) => movePiece(current, selected.id, position, createId('request')) ?? current);
  }

  function undo() {
    setGame((current) => undoHumanTurn(current, createId('request')));
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
    canUndo: canUndoHumanTurn(game),
    gameId: game.gameId,
    gameOver,
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
    recentMoves,
    resultView,
    restart,
    retryAi,
    selectedId,
    selectPosition,
    settings: game.settings,
    startedAt: game.startedAt,
    status,
    turn,
    undo,
    updateSettings,
  };
}

export type ChessGame = ReturnType<typeof useChessGame>;
export type BoardIndex = Map<string, Piece>;
