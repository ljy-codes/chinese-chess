import { difficultyLabel, formatDuration, formatStartedAt, type GameHistoryRecord } from '../game/game-history';

interface GameHistoryDialogProps {
  records: GameHistoryRecord[];
  onClose: () => void;
}

export function GameHistoryDialog({ records, onClose }: GameHistoryDialogProps) {
  return (
    <div className="history-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header>
          <div>
            <span>本机对局记录</span>
            <h2 id="history-title">信息</h2>
          </div>
          <button type="button" aria-label="关闭历史记录" onClick={onClose}>关闭</button>
        </header>
        <div className="history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>开始时间</th>
                <th>棋局时长</th>
                <th>难度</th>
                <th>胜负</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td className="history-empty" colSpan={4}>暂无已完成的对局</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.gameId}>
                    <td>{formatStartedAt(record.startedAt)}</td>
                    <td>{formatDuration(record.durationSeconds)}</td>
                    <td>{difficultyLabel(record.difficulty)}</td>
                    <td><strong className={record.outcome}>{record.outcome === 'win' ? '胜' : '负'}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
