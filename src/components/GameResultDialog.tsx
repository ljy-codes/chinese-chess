import type { CSSProperties } from 'react';
import type { GameResultView } from '../game/game-result';

const FIREWORKS = [
  [14, 20], [82, 18], [28, 72], [72, 68], [49, 27], [52, 80],
];
const SPARKS = Array.from({ length: 12 }, (_, index) => index * 30);
const CONFETTI = Array.from({ length: 36 }, (_, index) => ({
  delay: (index % 12) * 0.11,
  drift: ((index * 37) % 120) - 60,
  left: (index * 29) % 100,
  duration: 2.8 + (index % 5) * 0.34,
}));

interface GameResultDialogProps {
  result: GameResultView;
  onRestart: () => void;
}

export function GameResultDialog({ result, onRestart }: GameResultDialogProps) {
  const won = result.outcome === 'win';

  return (
    <div className={`result-backdrop ${result.outcome}`} role="presentation">
      {won && (
        <div className="victory-effects" aria-hidden="true">
          <div className="victory-rays" />
          <div className="fireworks">
            {FIREWORKS.map(([left, top]) => (
              <span className="firework" style={{ left: `${left}%`, top: `${top}%` }} key={`${left}-${top}`}>
                {SPARKS.map((angle) => <i style={{ transform: `rotate(${angle}deg)` }} key={angle} />)}
              </span>
            ))}
          </div>
          <div className="confetti">
            {CONFETTI.map((piece, index) => (
              <i
                style={{
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  left: `${piece.left}%`,
                  '--confetti-drift': `${piece.drift}px`,
                } as CSSProperties}
                key={index}
              />
            ))}
          </div>
          <div className="firecracker firecracker-left">爆</div>
          <div className="firecracker firecracker-right">竹</div>
        </div>
      )}
      <section className={`result-dialog ${result.outcome}`} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span className="result-kicker">{won ? '大捷 · 全场喝彩' : '本局终了'}</span>
        <h2 id="result-title">{won ? '胜利' : '再接再厉'}</h2>
        <p>{result.title} · {result.detail}</p>
        <button type="button" onClick={onRestart}>再来一局</button>
      </section>
    </div>
  );
}
