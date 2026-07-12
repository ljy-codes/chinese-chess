import { AI_DIFFICULTY_CONFIG } from '../game/ai/config';
import type { AiSearchResult } from '../game/ai/types';
import type { AiDifficulty, GameSettings, PlayerSidePreference } from '../game/types';

interface SettingsPanelProps {
  aiError?: string;
  aiStats?: AiSearchResult;
  humanSide: 'red' | 'black';
  isAiTurn: boolean;
  isAiThinking: boolean;
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onRetryAi: () => void;
}

export function SettingsPanel({ aiError, aiStats, humanSide, isAiTurn, isAiThinking, settings, onChange, onRetryAi }: SettingsPanelProps) {
  const update = <Key extends keyof GameSettings>(key: Key, value: GameSettings[Key]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <aside className="settings-panel">
      <div className="panel-heading">
        <span>棋局设定</span>
        <strong>人机对弈</strong>
      </div>

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
      <div className={`ai-stage-note${isAiThinking ? ' waiting' : ''}${aiError ? ' failed' : ''}`}>
        <span className="ai-dot" aria-hidden="true" />
        <p>
          <strong>你执{humanSide === 'red' ? '红' : '黑'}</strong>
          {aiError
            ? aiError
            : isAiThinking
              ? `AI 思考中 · 最长 ${AI_DIFFICULTY_CONFIG[settings.aiDifficulty].timeLimitMs}ms`
              : aiStats
                ? `深度 ${aiStats.depth} · ${aiStats.nodes.toLocaleString()} 节点 · ${Math.round(aiStats.elapsedMs)}ms`
                : isAiTurn ? '准备计算' : `${AI_DIFFICULTY_CONFIG[settings.aiDifficulty].label}难度`}
        </p>
        {aiError && <button type="button" onClick={onRetryAi}>重试</button>}
      </div>
    </aside>
  );
}
