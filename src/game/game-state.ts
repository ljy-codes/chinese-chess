import { createInitialPieces } from './chess';
import type { GameSettings, GameState, PlayerSidePreference, Side } from './types';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'human-vs-human',
  playerSide: 'red',
  aiDifficulty: 'normal',
};

export type IdFactory = (scope: 'game' | 'request') => string;

export function createId(scope: 'game' | 'request'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${scope}-${crypto.randomUUID()}`;
  }
  return `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function resolveHumanSide(
  preference: PlayerSidePreference,
  random: () => number = Math.random,
): Side {
  if (preference !== 'random') return preference;
  return random() < 0.5 ? 'red' : 'black';
}

export function createGameState(
  settings: GameSettings = DEFAULT_GAME_SETTINGS,
  idFactory: IdFactory = createId,
  random: () => number = Math.random,
): GameState {
  return {
    pieces: createInitialPieces(),
    turn: 'red',
    history: [],
    settings,
    humanSide: resolveHumanSide(settings.playerSide, random),
    gameId: idFactory('game'),
    positionVersion: 0,
    requestId: idFactory('request'),
  };
}

export function canHumanMove(state: GameState): boolean {
  return state.settings.mode === 'human-vs-human' || state.turn === state.humanSide;
}

export function isCurrentRequest(
  state: GameState,
  identity: Pick<GameState, 'gameId' | 'positionVersion' | 'requestId'>,
): boolean {
  return state.gameId === identity.gameId
    && state.positionVersion === identity.positionVersion
    && state.requestId === identity.requestId;
}
