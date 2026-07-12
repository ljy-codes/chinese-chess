import { PIECE_LABELS } from '../game/chess';
import { getMoveMarkers, type RecentMoves } from '../game/board-markers';
import type { Move, Position, Side } from '../game/types';
import { positionKey, type BoardIndex } from '../hooks/useChessGame';
import { ChessPiece } from './ChessPiece';

const POINTS = Array.from({ length: 90 }, (_, index) => ({
  row: Math.floor(index / 9),
  col: index % 9,
}));
const GRID_INSET = 5.4;
const GRID_SPAN = 100 - GRID_INSET * 2;

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;
const sideName = (side: Side) => side === 'red' ? '红方' : '黑方';

interface ChessBoardProps {
  boardIndex: BoardIndex;
  disabled?: boolean;
  isAiTurn?: boolean;
  lastMove?: Move;
  legalMoveKeys: Set<string>;
  recentMoves: RecentMoves;
  selectedId?: string;
  onSelect: (position: Position) => void;
}

export function ChessBoard({ boardIndex, disabled, isAiTurn, lastMove, legalMoveKeys, recentMoves, selectedId, onSelect }: ChessBoardProps) {
  return (
    <div className="board-wrap">
      <div className={`board${disabled ? ' board-disabled' : ''}${isAiTurn ? ' board-ai-turn' : ''}`} role="grid" aria-label="中国象棋棋盘" aria-disabled={disabled}>
        <div className="board-lines" aria-hidden="true">
          <svg viewBox="0 0 8 9" preserveAspectRatio="none">
            {Array.from({ length: 10 }, (_, row) => <line x1="0" y1={row} x2="8" y2={row} key={`h-${row}`} />)}
            <line x1="0" y1="0" x2="0" y2="9" />
            <line x1="8" y1="0" x2="8" y2="9" />
            {Array.from({ length: 7 }, (_, index) => index + 1).flatMap((col) => [
              <line x1={col} y1="0" x2={col} y2="4" key={`v-${col}-top`} />,
              <line x1={col} y1="5" x2={col} y2="9" key={`v-${col}-bottom`} />,
            ])}
            <line x1="3" y1="0" x2="5" y2="2" />
            <line x1="5" y1="0" x2="3" y2="2" />
            <line x1="3" y1="7" x2="5" y2="9" />
            <line x1="5" y1="7" x2="3" y2="9" />
          </svg>
          <div className="river"><span>楚 河</span><span>漢 界</span></div>
        </div>
        {POINTS.map((position) => {
          const key = positionKey(position);
          const piece = boardIndex.get(key);
          const legal = legalMoveKeys.has(key);
          const isLast = lastMove && (samePosition(lastMove.from, position) || samePosition(lastMove.to, position));
          const moveMarkers = getMoveMarkers(position, recentMoves);
          const legalClass = legal ? piece ? ' legal legal-capture' : ' legal legal-empty' : '';
          return (
            <button
              className={`point${legalClass}${piece && selectedId === piece.id ? ' selected' : ''}${isLast ? ' last' : ''}`}
              style={{
                left: `${GRID_INSET + position.col * GRID_SPAN / 8}%`,
                top: `${GRID_INSET + position.row * GRID_SPAN / 9}%`,
              }}
              onClick={() => onSelect(position)}
              disabled={disabled}
              aria-label={piece ? `${sideName(piece.side)}${PIECE_LABELS[piece.side][piece.type]}` : `${position.row},${position.col}`}
              key={key}
            >
              {piece && <ChessPiece piece={piece} />}
              {moveMarkers.map((marker) => (
                <span
                  className={`move-trace ${marker.side} ${marker.endpoint}`}
                  aria-hidden="true"
                  key={`${marker.side}-${marker.endpoint}`}
                />
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
