import { useEffect, useRef, useState } from 'react';
import { gameAudio } from '../audio/game-audio';
import { deriveGameAudioEvents, type GameAudioSnapshot } from '../audio/game-audio-events';

export function useGameAudio(snapshot: GameAudioSnapshot) {
  const previous = useRef(snapshot);
  const [enabled, setEnabled] = useState(gameAudio.isEnabled);
  const [muted, setMuted] = useState(gameAudio.isMuted);

  useEffect(() => {
    const gameChanged = previous.current.gameId !== snapshot.gameId;
    const events = deriveGameAudioEvents(previous.current, snapshot);
    previous.current = snapshot;
    for (const event of events) gameAudio.play(event);
    if (gameChanged) gameAudio.cancelPending();
  }, [snapshot]);

  async function enable() {
    const ready = await gameAudio.enable();
    setEnabled(ready);
  }

  function toggleMute() {
    const next = !muted;
    gameAudio.setMuted(next);
    setMuted(next);
  }

  return { enabled, muted, enable, toggleMute };
}
