import type { GameStatus, Side } from './types';

export interface GameResultView {
  outcome: 'win' | 'lose';
  title: string;
  detail: string;
}

const sideName = (side: Side) => side === 'red' ? '红方' : '黑方';
const opposite = (side: Side): Side => side === 'red' ? 'black' : 'red';

export function isGameOver(status: GameStatus): boolean {
  return status.kind === 'checkmate' || status.kind === 'stalemate';
}

export function getGameResultView(status: GameStatus, humanSide: Side): GameResultView | null {
  if (!isGameOver(status) || !status.winner) return null;
  const won = status.winner === humanSide;
  const loser = opposite(status.winner);
  return {
    outcome: won ? 'win' : 'lose',
    title: `${sideName(status.winner)}胜`,
    detail: `${sideName(loser)}负 · ${status.kind === 'stalemate' ? '困毙' : '将死'}`,
  };
}
