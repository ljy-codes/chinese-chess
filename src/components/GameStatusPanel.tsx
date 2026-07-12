import type { GameStatus, Side } from '../game/types';

const sideName = (side: Side) => side === 'red' ? '红方' : '黑方';

interface GameStatusPanelProps {
  isAiTurn?: boolean;
  moveCount: number;
  status: GameStatus;
  turn: Side;
}

export function GameStatusPanel({ isAiTurn, moveCount, status, turn }: GameStatusPanelProps) {
  const statusText = isAiTurn
    ? '等待 AI 行棋'
    : status.kind === 'checkmate'
    ? `${sideName(status.winner!)}胜`
    : status.kind === 'stalemate'
      ? `${sideName(status.winner!)}困毙获胜`
      : status.kind === 'check'
        ? `${sideName(turn)}被将军`
        : `${sideName(turn)}行棋`;

  return (
    <div className={`status ${status.kind}`}>
      <span className="status-kicker">第 {moveCount + 1} 手</span>
      <strong>{statusText}</strong>
    </div>
  );
}
