import { useMemo, useState } from 'react';
import { getGameStatus, getLegalMoves, makeMove } from '../game/chess';
import { canHumanMove, createGameState, createId } from '../game/game-state';
import type { GameSettings, Piece, Position } from '../game/types';

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

  return {
    boardIndex,
    gameId: game.gameId,
    humanSide: game.humanSide,
    history,
    isAiTurn,
    lastMove,
    legalMoveKeys,
    pieces,
    positionVersion: game.positionVersion,
    requestId: game.requestId,
    restart,
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
