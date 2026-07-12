import { ChessBoard } from '../components/ChessBoard';
import { GameControls } from '../components/GameControls';
import { GameStatusPanel } from '../components/GameStatusPanel';
import { MoveHistory } from '../components/MoveHistory';
import { PlayerStatus } from '../components/PlayerStatus';
import { SettingsPanel } from '../components/SettingsPanel';
import { useChessGame } from '../hooks/useChessGame';

function App() {
  const game = useChessGame();
  const redController = game.settings.mode === 'human-vs-ai' && game.humanSide !== 'red' ? 'ai' : 'human';
  const blackController = game.settings.mode === 'human-vs-ai' && game.humanSide !== 'black' ? 'ai' : 'human';

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="seal" aria-hidden="true">弈</div>
        <div>
          <p className="eyebrow">东方棋局 · {game.settings.mode === 'human-vs-ai' ? '人机对弈' : '双人对弈'}</p>
          <h1>楚河<span>汉界</span></h1>
        </div>
        <p className="header-note">方寸之间<br />运筹千里</p>
      </header>

      <section className="game-workspace">
        <div className="game-layout">
          <PlayerStatus controller={blackController} side="black" turn={game.turn} />
          <ChessBoard
            boardIndex={game.boardIndex}
            disabled={game.isAiTurn}
            lastMove={game.lastMove}
            legalMoveKeys={game.legalMoveKeys}
            selectedId={game.selectedId}
            onSelect={game.selectPosition}
          />
          <PlayerStatus controller={redController} side="red" turn={game.turn} />
        </div>
        <SettingsPanel
          humanSide={game.humanSide}
          isAiTurn={game.isAiTurn}
          settings={game.settings}
          onChange={game.updateSettings}
        />
      </section>

      <section className="control-bar">
        <GameStatusPanel isAiTurn={game.isAiTurn} moveCount={game.history.length} status={game.status} turn={game.turn} />
        <GameControls canUndo={game.history.length > 0} onRestart={game.restart} onUndo={game.undo} />
        <MoveHistory lastMove={game.lastMove} />
      </section>

      <footer>观棋不语真君子 · 举手无悔大丈夫</footer>
    </main>
  );
}

export default App;
