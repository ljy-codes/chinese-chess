import { ChessBoard } from '../components/ChessBoard';
import { GameControls } from '../components/GameControls';
import { GameStatusPanel } from '../components/GameStatusPanel';
import { GameResultDialog } from '../components/GameResultDialog';
import { MoveHistory } from '../components/MoveHistory';
import { PlayerStatus } from '../components/PlayerStatus';
import { SettingsPanel } from '../components/SettingsPanel';
import { useChessGame } from '../hooks/useChessGame';

function App() {
  const game = useChessGame();
  const redController = game.humanSide === 'red' ? 'human' : 'ai';
  const blackController = game.humanSide === 'black' ? 'human' : 'ai';

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="seal" aria-hidden="true">弈</div>
        <div>
          <p className="eyebrow">东方棋局 · 人机对弈</p>
          <h1>楚河<span>汉界</span></h1>
        </div>
        <p className="header-note">方寸之间<br />运筹千里</p>
      </header>

      <section className="game-workspace">
        <div className="game-layout">
          <PlayerStatus controller={blackController} side="black" turn={game.turn} />
          <ChessBoard
            boardIndex={game.boardIndex}
            disabled={game.isAiTurn || game.gameOver}
            isAiTurn={game.isAiTurn}
            lastMove={game.lastMove}
            legalMoveKeys={game.legalMoveKeys}
            recentMoves={game.recentMoves}
            selectedId={game.selectedId}
            onSelect={game.selectPosition}
          />
          <PlayerStatus controller={redController} side="red" turn={game.turn} />
        </div>
        <SettingsPanel
          aiError={game.aiError}
          aiStats={game.aiStats}
          humanSide={game.humanSide}
          isAiTurn={game.isAiTurn}
          isAiThinking={game.isAiThinking}
          result={game.resultView}
          settings={game.settings}
          onChange={game.updateSettings}
          onRetryAi={game.retryAi}
        />
      </section>

      <section className="control-bar">
        <GameStatusPanel isAiTurn={game.isAiThinking} moveCount={game.history.length} status={game.status} turn={game.turn} />
        <GameControls canUndo={game.canUndo} onRestart={game.restart} onUndo={game.undo} />
        <MoveHistory lastMove={game.lastMove} />
      </section>

      <footer>观棋不语真君子 · 举手无悔大丈夫</footer>
      {game.resultView && <GameResultDialog result={game.resultView} onRestart={game.restart} />}
    </main>
  );
}

export default App;
