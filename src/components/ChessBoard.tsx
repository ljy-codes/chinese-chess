import { PIECE_LABELS } from '../game/chess';
import { getMoveMarkers, type RecentMoves } from '../game/board-markers';
import type { Move, Position, Side } from '../game/types';
import { positionKey, type BoardIndex } from '../hooks/useChessGame';
import { ChessPiece } from './ChessPiece';

const POINTS = Array.from({ length: 90 }, (_, index) => ({
  row: Math.floor(index / 9),
  col: index % 9,
}));
const HORIZONTAL_LINES = Array.from({ length: 10 }, (_, index) => index);
const VERTICAL_LINES = Array.from({ length: 9 }, (_, index) => index);

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;
const sideName = (side: Side) => side === 'red' ? '红方' : '黑方';

interface ChessBoardProps {
  boardIndex: BoardIndex;
  disabled?: boolean;
  lastMove?: Move;
  legalMoveKeys: Set<string>;
  recentMoves: RecentMoves;
  selectedId?: string;
  onSelect: (position: Position) => void;
}

export function ChessBoard({ boardIndex, disabled, lastMove, legalMoveKeys, recentMoves, selectedId, onSelect }: ChessBoardProps) {
  return (
    <div className="board-wrap">
      <div className={`board${disabled ? ' board-disabled' : ''}`} role="grid" aria-label="中国象棋棋盘" aria-disabled={disabled}>
        <div className="board-lines" aria-hidden="true">
          {HORIZONTAL_LINES.map((index) => <i className="horizontal" style={{ top: `${index * 11.111}%` }} key={`h-${index}`} />)}
          {VERTICAL_LINES.map((index) => <i className={`vertical v-${index}`} style={{ left: `${index * 12.5}%` }} key={`v-${index}`} />)}
          <i className="palace black-palace-a" /><i className="palace black-palace-b" />
          <i className="palace red-palace-a" /><i className="palace red-palace-b" />
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
              style={{ left: `${5.4 + position.col * 11.15}%`, top: `${5.4 + position.row * 9.91}%` }}
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
                >
                  {marker.endpoint === 'from' ? '起' : '落'}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
