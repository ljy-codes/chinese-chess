import { useEffect, useEffectEvent, useState } from 'react';
import type { AiSearchRequest, AiSearchResult, AiWorkerResponse } from '../game/ai/types';

interface AiOutcome {
  requestId: string;
  result?: AiSearchResult;
  error?: string;
}

export function useChessAi(
  request: AiSearchRequest | null,
  onResult: (result: AiSearchResult) => void,
) {
  const [outcome, setOutcome] = useState<AiOutcome>();
  const handleResult = useEffectEvent(onResult);

  useEffect(() => {
    if (!request) return;

    const worker = new Worker(
      new URL('../workers/chess-ai.worker.ts', import.meta.url),
      { type: 'module' },
    );
    let settled = false;

    const watchdog = window.setTimeout(() => {
      settled = true;
      worker.terminate();
      setOutcome({ requestId: request.requestId, error: 'AI 计算超时，请重试' });
    }, request.timeLimitMs + 750);

    worker.onmessage = (event: MessageEvent<AiWorkerResponse>) => {
      const response = event.data;
      if (settled
        || response.requestId !== request.requestId
        || response.gameId !== request.gameId
        || response.positionVersion !== request.positionVersion) return;

      settled = true;
      window.clearTimeout(watchdog);
      worker.terminate();
      if (response.type === 'error') {
        setOutcome({ requestId: request.requestId, error: response.message });
        return;
      }
      setOutcome({ requestId: request.requestId, result: response });
      handleResult(response);
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      worker.terminate();
      setOutcome({ requestId: request.requestId, error: 'AI Worker 加载失败，请重试' });
    };

    worker.postMessage(request);
    return () => {
      settled = true;
      window.clearTimeout(watchdog);
      worker.terminate();
    };
  }, [request]);

  const currentOutcome = request && outcome?.requestId === request.requestId ? outcome : undefined;
  return {
    error: currentOutcome?.error,
    isThinking: Boolean(request && !currentOutcome),
    stats: currentOutcome?.result,
  };
}
