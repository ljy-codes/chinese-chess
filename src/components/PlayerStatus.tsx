import type { Side } from '../game/types';

interface PlayerStatusProps {
  controller?: 'human' | 'ai';
  side: Side;
  turn: Side;
}

export function PlayerStatus({ controller = 'human', side, turn }: PlayerStatusProps) {
  const red = side === 'red';
  return (
    <aside className={`side-panel ${side}-panel`}>
      <div className={`player-mark ${side}-mark`}>{red ? '帅' : '将'}</div>
      <p>{controller === 'ai' ? 'AI 执棋' : red ? '执红' : '执黑'}</p>
      <strong>{red ? '红方' : '黑方'}</strong>
      <span className={turn === side ? 'turn-light active' : 'turn-light'} />
    </aside>
  );
}
