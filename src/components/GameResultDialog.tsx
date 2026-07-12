import type { GameResultView } from '../game/game-result';

interface GameResultDialogProps {
  result: GameResultView;
  onRestart: () => void;
}

export function GameResultDialog({ result, onRestart }: GameResultDialogProps) {
  return (
    <div className="result-backdrop" role="presentation">
      <section className={`result-dialog ${result.outcome}`} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span className="result-kicker">本局终了</span>
        <h2 id="result-title">{result.title}</h2>
        <p>{result.detail}</p>
        <button type="button" onClick={onRestart}>再来一局</button>
      </section>
    </div>
  );
}
