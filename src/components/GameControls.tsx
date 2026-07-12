interface GameControlsProps {
  canUndo: boolean;
  onShowHistory: () => void;
  onRestart: () => void;
  onUndo: () => void;
}

export function GameControls({ canUndo, onShowHistory, onRestart, onUndo }: GameControlsProps) {
  return (
    <div className="actions">
      <button onClick={onUndo} disabled={!canUndo}>悔棋</button>
      <button onClick={onShowHistory}>历史记录</button>
      <button className="restart" onClick={onRestart}>重新开局</button>
    </div>
  );
}
