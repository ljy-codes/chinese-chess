import { AI_DIFFICULTY_CONFIG } from '../game/ai/config';
import type { AiDifficulty, GameMode, GameSettings, PlayerSidePreference } from '../game/types';

interface SettingsPanelProps {
  humanSide: 'red' | 'black';
  isAiTurn: boolean;
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}

export function SettingsPanel({ humanSide, isAiTurn, settings, onChange }: SettingsPanelProps) {
  const update = <Key extends keyof GameSettings>(key: Key, value: GameSettings[Key]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <aside className="settings-panel">
      <div className="panel-heading">
        <span>棋局设定</span>
        <strong>{settings.mode === 'human-vs-ai' ? '人机对弈' : '双人对弈'}</strong>
      </div>

      <label>
        <span>对局模式</span>
        <select value={settings.mode} onChange={(event) => update('mode', event.target.value as GameMode)}>
          <option value="human-vs-human">双人对弈</option>
          <option value="human-vs-ai">人机对弈</option>
        </select>
      </label>

      {settings.mode === 'human-vs-ai' && (
        <>
          <label>
            <span>玩家执棋</span>
            <select value={settings.playerSide} onChange={(event) => update('playerSide', event.target.value as PlayerSidePreference)}>
              <option value="red">执红先行</option>
              <option value="black">执黑后行</option>
              <option value="random">随机执棋</option>
            </select>
          </label>
          <label>
            <span>棋力难度</span>
            <select value={settings.aiDifficulty} onChange={(event) => update('aiDifficulty', event.target.value as AiDifficulty)}>
              {Object.entries(AI_DIFFICULTY_CONFIG).map(([difficulty, config]) => (
                <option value={difficulty} key={difficulty}>{config.label}</option>
              ))}
            </select>
          </label>
          <div className={`ai-stage-note${isAiTurn ? ' waiting' : ''}`}>
            <span className="ai-dot" />
            <p>
              <strong>你执{humanSide === 'red' ? '红' : '黑'}</strong>
              {isAiTurn ? 'AI 搜索引擎待下一阶段接入' : `${AI_DIFFICULTY_CONFIG[settings.aiDifficulty].label}难度`}
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
