import type { GameStatus, Move, Piece, PieceType, Position, Side } from './types';

export const PIECE_LABELS: Record<Side, Record<PieceType, string>> = {
  red: { king: '帅', advisor: '仕', elephant: '相', horse: '马', rook: '车', cannon: '炮', pawn: '兵' },
  black: { king: '将', advisor: '士', elephant: '象', horse: '马', rook: '车', cannon: '炮', pawn: '卒' },
};

const opposite = (side: Side): Side => (side === 'red' ? 'black' : 'red');
const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;
const inBoard = ({ row, col }: Position) => row >= 0 && row < 10 && col >= 0 && col < 9;
const at = (pieces: Piece[], position: Position) => pieces.find((piece) => samePosition(piece, position));

function createBackRank(side: Side, row: number): Piece[] {
  const types: PieceType[] = ['rook', 'horse', 'elephant', 'advisor', 'king', 'advisor', 'elephant', 'horse', 'rook'];
  return types.map((type, col) => ({ id: `${side}-${type}-${col}`, side, type, row, col }));
}

export function createInitialPieces(): Piece[] {
  return [
    ...createBackRank('black', 0),
    { id: 'black-cannon-1', side: 'black', type: 'cannon', row: 2, col: 1 },
    { id: 'black-cannon-7', side: 'black', type: 'cannon', row: 2, col: 7 },
    ...[0, 2, 4, 6, 8].map((col) => ({ id: `black-pawn-${col}`, side: 'black' as const, type: 'pawn' as const, row: 3, col })),
    ...[0, 2, 4, 6, 8].map((col) => ({ id: `red-pawn-${col}`, side: 'red' as const, type: 'pawn' as const, row: 6, col })),
    { id: 'red-cannon-1', side: 'red', type: 'cannon', row: 7, col: 1 },
    { id: 'red-cannon-7', side: 'red', type: 'cannon', row: 7, col: 7 },
    ...createBackRank('red', 9),
  ];
}

function piecesBetween(pieces: Piece[], from: Position, to: Position): number {
  if (from.row === to.row) {
    const min = Math.min(from.col, to.col);
    const max = Math.max(from.col, to.col);
    return pieces.filter((piece) => piece.row === from.row && piece.col > min && piece.col < max).length;
  }
  if (from.col === to.col) {
    const min = Math.min(from.row, to.row);
    const max = Math.max(from.row, to.row);
    return pieces.filter((piece) => piece.col === from.col && piece.row > min && piece.row < max).length;
  }
  return -1;
}

function isPseudoLegal(piece: Piece, to: Position, pieces: Piece[]): boolean {
  if (!inBoard(to) || samePosition(piece, to)) return false;
  const target = at(pieces, to);
  if (target?.side === piece.side) return false;

  const rowDelta = to.row - piece.row;
  const colDelta = to.col - piece.col;
  const absRow = Math.abs(rowDelta);
  const absCol = Math.abs(colDelta);

  switch (piece.type) {
    case 'rook':
      return piecesBetween(pieces, piece, to) === 0;
    case 'cannon': {
      const between = piecesBetween(pieces, piece, to);
      return target ? between === 1 : between === 0;
    }
    case 'horse': {
      if (!((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))) return false;
      const leg = absRow === 2
        ? { row: piece.row + rowDelta / 2, col: piece.col }
        : { row: piece.row, col: piece.col + colDelta / 2 };
      return !at(pieces, leg);
    }
    case 'elephant': {
      if (absRow !== 2 || absCol !== 2) return false;
      if (piece.side === 'red' ? to.row < 5 : to.row > 4) return false;
      return !at(pieces, { row: piece.row + rowDelta / 2, col: piece.col + colDelta / 2 });
    }
    case 'advisor':
      return absRow === 1 && absCol === 1 && to.col >= 3 && to.col <= 5
        && (piece.side === 'red' ? to.row >= 7 : to.row <= 2);
    case 'king': {
      if (target?.type === 'king' && piece.col === to.col) return piecesBetween(pieces, piece, to) === 0;
      return absRow + absCol === 1 && to.col >= 3 && to.col <= 5
        && (piece.side === 'red' ? to.row >= 7 : to.row <= 2);
    }
    case 'pawn': {
      const forward = piece.side === 'red' ? -1 : 1;
      if (rowDelta === forward && colDelta === 0) return true;
      const crossedRiver = piece.side === 'red' ? piece.row <= 4 : piece.row >= 5;
      return crossedRiver && rowDelta === 0 && absCol === 1;
    }
  }
}

export function applyMove(pieces: Piece[], pieceId: string, to: Position): Piece[] {
  return pieces
    .filter((piece) => !samePosition(piece, to) || piece.id === pieceId)
    .map((piece) => piece.id === pieceId ? { ...piece, ...to } : piece);
}

export function isInCheck(pieces: Piece[], side: Side): boolean {
  const king = pieces.find((piece) => piece.side === side && piece.type === 'king');
  if (!king) return true;
  return pieces.some((piece) => piece.side !== side && isPseudoLegal(piece, king, pieces));
}

export function isLegalMove(pieces: Piece[], piece: Piece, to: Position): boolean {
  return isPseudoLegal(piece, to, pieces) && !isInCheck(applyMove(pieces, piece.id, to), piece.side);
}

export function getLegalMoves(pieces: Piece[], piece: Piece): Position[] {
  const moves: Position[] = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (isLegalMove(pieces, piece, { row, col })) moves.push({ row, col });
    }
  }
  return moves;
}

export function getGameStatus(pieces: Piece[], turn: Side): GameStatus {
  const kingExists = pieces.some((piece) => piece.side === turn && piece.type === 'king');
  if (!kingExists) return { kind: 'checkmate', winner: opposite(turn) };

  const hasMove = pieces
    .filter((piece) => piece.side === turn)
    .some((piece) => getLegalMoves(pieces, piece).length > 0);
  const checked = isInCheck(pieces, turn);
  if (!hasMove) return { kind: checked ? 'checkmate' : 'stalemate', winner: opposite(turn) };
  return { kind: checked ? 'check' : 'playing' };
}

export function makeMove(pieces: Piece[], piece: Piece, to: Position): { pieces: Piece[]; move: Move } {
  const captured = at(pieces, to);
  return {
    pieces: applyMove(pieces, piece.id, to),
    move: { piece, from: { row: piece.row, col: piece.col }, to, captured },
  };
}

const FILES = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
export function formatMove(move: Move): string {
  const file = move.piece.side === 'red' ? FILES[move.from.col] : String(move.from.col + 1);
  const destination = move.piece.side === 'red' ? FILES[move.to.col] : String(move.to.col + 1);
  return `${PIECE_LABELS[move.piece.side][move.piece.type]}${file} → ${destination}`;
}
