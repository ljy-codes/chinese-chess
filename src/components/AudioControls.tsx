interface AudioControlsProps {
  enabled: boolean;
  muted: boolean;
  onEnable: () => void;
  onToggleMute: () => void;
}

export function AudioControls({ enabled, muted, onEnable, onToggleMute }: AudioControlsProps) {
  return (
    <div className="audio-controls">
      <span className={`audio-wave${enabled && !muted ? ' active' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
      <div>
        <strong>山涧声场</strong>
        <span>{!enabled ? '等待授权' : muted ? '已静音' : '流水与落子音已开启'}</span>
      </div>
      <button type="button" aria-pressed={enabled && !muted} onClick={enabled ? onToggleMute : onEnable}>
        {!enabled ? '开启声场' : muted ? '恢复声音' : '静音'}
      </button>
    </div>
  );
}
