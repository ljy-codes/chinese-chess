import type { GameAudioEvent } from './game-audio-events';

type AudioContextConstructor = typeof AudioContext;

class GameAudio {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private ambientSources: AudioScheduledSourceNode[] = [];
  private melodyTimer?: number;
  private melodyIndex = 0;
  private enabled = false;
  private muted = false;
  private endTimer?: number;

  get isEnabled() {
    return this.enabled;
  }

  get isMuted() {
    return this.muted;
  }

  async enable(): Promise<boolean> {
    try {
      if (!this.context) this.createGraph();
      await this.context!.resume();
      this.enabled = true;
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.context || !this.musicGain || !this.effectsGain) return;
    const now = this.context.currentTime;
    this.musicGain.gain.setTargetAtTime(muted ? 0 : 0.16, now, 0.05);
    this.effectsGain.gain.setTargetAtTime(muted ? 0 : 0.34, now, 0.03);
    if (!muted && this.context.state === 'suspended') void this.context.resume();
  }

  play(event: GameAudioEvent) {
    if (!this.enabled || this.muted || !this.context || !this.effectsGain) return;
    if (this.context.state === 'suspended') void this.context.resume();
    if (event === 'gameEnd') {
      window.clearTimeout(this.endTimer);
      this.endTimer = window.setTimeout(() => this.playEnding(), 230);
      return;
    }
    if (event === 'capture') this.playCapture();
    else this.playMove();
  }

  cancelPending() {
    window.clearTimeout(this.endTimer);
  }

  private createGraph() {
    const Constructor = (window.AudioContext || (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext);
    if (!Constructor) throw new Error('Web Audio is unavailable');
    this.context = new Constructor();
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.musicGain.gain.value = this.muted ? 0 : 0.16;
    this.effectsGain.gain.value = this.muted ? 0 : 0.34;
    this.musicGain.connect(this.context.destination);
    this.effectsGain.connect(this.context.destination);
    this.startMountainStream();
  }

  private startMountainStream() {
    const context = this.context!;
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let filtered = 0;
    for (let index = 0; index < samples.length; index += 1) {
      filtered = filtered * 0.82 + (Math.random() * 2 - 1) * 0.18;
      samples[index] = filtered * (0.72 + Math.sin(index / 431) * 0.12);
    }

    const stream = context.createBufferSource();
    const streamFilter = context.createBiquadFilter();
    const streamGain = context.createGain();
    stream.buffer = buffer;
    stream.loop = true;
    streamFilter.type = 'bandpass';
    streamFilter.frequency.value = 1450;
    streamFilter.Q.value = 0.55;
    streamGain.gain.value = 0.28;
    stream.connect(streamFilter).connect(streamGain).connect(this.musicGain!);
    stream.start();
    this.ambientSources.push(stream);

    [196, 293.66, 440].forEach((frequency, index) => {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = index === 0 ? 'sine' : 'triangle';
      tone.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.035 : 0.012;
      tone.connect(gain).connect(this.musicGain!);
      tone.start();
      this.ambientSources.push(tone);
    });
    this.scheduleMelody();
  }

  private scheduleMelody() {
    if (!this.context || !this.musicGain) return;
    const pentatonic = [392, 440, 523.25, 587.33, 659.25, 587.33, 523.25, 440];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.value = pentatonic[this.melodyIndex % pentatonic.length];
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
    oscillator.connect(gain).connect(this.musicGain);
    oscillator.start(now);
    oscillator.stop(now + 2.7);
    this.melodyIndex += 1;
    this.melodyTimer = window.setTimeout(() => this.scheduleMelody(), 3200 + Math.random() * 1800);
  }

  private playMove() {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(520, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, context.currentTime + 0.075);
    gain.gain.setValueAtTime(0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.connect(gain).connect(this.effectsGain!);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  }

  private playCapture() {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.62, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    oscillator.connect(gain).connect(this.effectsGain!);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.21);
  }

  private playEnding() {
    if (!this.context || !this.effectsGain || this.muted) return;
    const now = this.context.currentTime;
    [261.63, 392, 523.25].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = now + index * 0.14;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.32, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.75);
      oscillator.connect(gain).connect(this.effectsGain!);
      oscillator.start(start);
      oscillator.stop(start + 0.8);
    });
  }
}

export const gameAudio = new GameAudio();
