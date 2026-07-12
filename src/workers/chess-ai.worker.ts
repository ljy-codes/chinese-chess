/// <reference lib="webworker" />

import { searchBestMove } from '../game/ai/search';
import type { AiSearchRequest, AiWorkerResponse } from '../game/ai/types';

self.onmessage = (event: MessageEvent<AiSearchRequest>) => {
  const request = event.data;
  try {
    self.postMessage(searchBestMove(request) satisfies AiWorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: request.requestId,
      gameId: request.gameId,
      positionVersion: request.positionVersion,
      message: error instanceof Error ? error.message : 'AI 搜索失败',
    } satisfies AiWorkerResponse);
  }
};

export {};
