import { PIECE_LABELS } from '../game/chess';
import type { Piece } from '../game/types';

interface ChessPieceProps {
  piece: Piece;
}

export function ChessPiece({ piece }: ChessPieceProps) {
  return (
    <span className={`piece ${piece.side}`}>
      <span className="piece-glyph">{PIECE_LABELS[piece.side][piece.type]}</span>
    </span>
  );
}
