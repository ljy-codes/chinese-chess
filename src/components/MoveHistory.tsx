import { formatMove } from '../game/chess';
import type { Move } from '../game/types';

interface MoveHistoryProps {
  lastMove?: Move;
}

export function MoveHistory({ lastMove }: MoveHistoryProps) {
  return (
    <div className="last-move">
      <span>上一手</span>
      <strong>{lastMove ? formatMove(lastMove) : '静候落子'}</strong>
    </div>
  );
}
