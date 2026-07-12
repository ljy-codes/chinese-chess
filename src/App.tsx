import { useState } from 'react';
import { createInitialPieces, formatMove, getGameStatus, getLegalMoves, makeMove, PIECE_LABELS } from './game/chess';
import type { Move, Piece, Position, Side } from './game/types';

const sideName = (side: Side) => side === 'red' ? '红方' : '黑方';
const isSame = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

function App() {
  const [pieces, setPieces] = useState(createInitialPieces);
  const [turn, setTurn] = useState<Side>('red');
  const [selectedId, setSelectedId] = useState<string>();
  const [history, setHistory] = useState<{ pieces: Piece[]; turn: Side; move: Move }[]>([]);
  const status = getGameStatus(pieces, turn);
  const selected = pieces.find((piece) => piece.id === selectedId);
  const legalMoves = selected ? getLegalMoves(pieces, selected) : [];
  const lastMove = history.at(-1)?.move;

  function selectPoint(position: Position) {
    if (status.kind === 'checkmate' || status.kind === 'stalemate') return;
    const clicked = pieces.find((piece) => isSame(piece, position));
    if (clicked?.side === turn) {
      setSelectedId(clicked.id);
      return;
    }
    if (!selected || !legalMoves.some((move) => isSame(move, position))) {
      setSelectedId(undefined);
      return;
    }

    const result = makeMove(pieces, selected, position);
    setHistory((current) => [...current, { pieces, turn, move: result.move }]);
    setPieces(result.pieces);
    setTurn(turn === 'red' ? 'black' : 'red');
    setSelectedId(undefined);
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setPieces(previous.pieces);
    setTurn(previous.turn);
    setHistory((current) => current.slice(0, -1));
    setSelectedId(undefined);
  }

  function restart() {
    setPieces(createInitialPieces());
    setTurn('red');
    setHistory([]);
    setSelectedId(undefined);
  }

  const statusText = status.kind === 'checkmate'
    ? `${sideName(status.winner!)}胜`
    : status.kind === 'stalemate'
      ? `${sideName(status.winner!)}困毙获胜`
      : status.kind === 'check'
        ? `${sideName(turn)}被将军`
        : `${sideName(turn)}行棋`;

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="seal" aria-hidden="true">弈</div>
        <div>
          <p className="eyebrow">东方棋局 · 双人对弈</p>
          <h1>楚河<span>汉界</span></h1>
        </div>
        <p className="header-note">方寸之间<br />运筹千里</p>
      </header>

      <section className="game-layout">
        <aside className="side-panel black-panel">
          <div className="player-mark black-mark">将</div>
          <p>执黑</p>
          <strong>黑方</strong>
          <span className={turn === 'black' ? 'turn-light active' : 'turn-light'} />
        </aside>

        <div className="board-wrap">
          <div className="board" role="grid" aria-label="中国象棋棋盘">
            <div className="board-lines" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => <i className="horizontal" style={{ top: `${index * 11.111}%` }} key={`h-${index}`} />)}
              {Array.from({ length: 9 }, (_, index) => <i className={`vertical v-${index}`} style={{ left: `${index * 12.5}%` }} key={`v-${index}`} />)}
              <i className="palace black-palace-a" /><i className="palace black-palace-b" />
              <i className="palace red-palace-a" /><i className="palace red-palace-b" />
              <div className="river"><span>楚 河</span><span>漢 界</span></div>
            </div>
            {Array.from({ length: 90 }, (_, index) => {
              const position = { row: Math.floor(index / 9), col: index % 9 };
              const piece = pieces.find((item) => isSame(item, position));
              const legal = legalMoves.some((move) => isSame(move, position));
              const isLast = lastMove && (isSame(lastMove.from, position) || isSame(lastMove.to, position));
              return (
                <button
                  className={`point${legal ? ' legal' : ''}${piece && selectedId === piece.id ? ' selected' : ''}${isLast ? ' last' : ''}`}
                  style={{ left: `${5.4 + position.col * 11.15}%`, top: `${5.4 + position.row * 9.91}%` }}
                  onClick={() => selectPoint(position)}
                  aria-label={piece ? `${sideName(piece.side)}${PIECE_LABELS[piece.side][piece.type]}` : `${position.row},${position.col}`}
                  key={index}
                >
                  {piece && <span className={`piece ${piece.side}`}>{PIECE_LABELS[piece.side][piece.type]}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="side-panel red-panel">
          <div className="player-mark red-mark">帅</div>
          <p>执红</p>
          <strong>红方</strong>
          <span className={turn === 'red' ? 'turn-light active' : 'turn-light'} />
        </aside>
      </section>

      <section className="control-bar">
        <div className={`status ${status.kind}`}>
          <span className="status-kicker">第 {history.length + 1} 手</span>
          <strong>{statusText}</strong>
        </div>
        <div className="actions">
          <button onClick={undo} disabled={!history.length}>悔棋</button>
          <button className="restart" onClick={restart}>重新开局</button>
        </div>
        <div className="last-move">
          <span>上一手</span>
          <strong>{lastMove ? formatMove(lastMove) : '静候落子'}</strong>
        </div>
      </section>

      <footer>观棋不语真君子 · 举手无悔大丈夫</footer>
    </main>
  );
}

export default App;
