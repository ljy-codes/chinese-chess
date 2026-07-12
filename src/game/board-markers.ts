import type { HistoryEntry, Move, Position, Side } from './types';

export type MoveEndpoint = 'from' | 'to';

export interface MoveMarker {
  side: Side;
  endpoint: MoveEndpoint;
}

export type RecentMoves = Partial<Record<Side, Move>>;

const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

export function getRecentMoves(history: HistoryEntry[]): RecentMoves {
  const recent: RecentMoves = {};
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const move = history[index].move;
    if (!recent[move.piece.side]) recent[move.piece.side] = move;
    if (recent.red && recent.black) break;
  }
  return recent;
}

export function getMoveMarkers(position: Position, recentMoves: RecentMoves): MoveMarker[] {
  const markers: MoveMarker[] = [];
  for (const side of ['red', 'black'] as const) {
    const move = recentMoves[side];
    if (!move) continue;
    if (samePosition(move.from, position)) markers.push({ side, endpoint: 'from' });
    if (samePosition(move.to, position)) markers.push({ side, endpoint: 'to' });
  }
  return markers;
}
