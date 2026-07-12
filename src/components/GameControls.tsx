interface GameControlsProps {
  canUndo: boolean;
  onRestart: () => void;
  onUndo: () => void;
}

export function GameControls({ canUndo, onRestart, onUndo }: GameControlsProps) {
  return (
    <div className="actions">
      <button onClick={onUndo} disabled={!canUndo}>悔棋</button>
      <button className="restart" onClick={onRestart}>重新开局</button>
    </div>
  );
}
