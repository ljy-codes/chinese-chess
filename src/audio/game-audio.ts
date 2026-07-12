import type { GameAudioEvent } from './game-audio-events';

type AudioContextConstructor = typeof AudioContext;

class GameAudio {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private ambientSources: AudioScheduledSourceNode[] = [];
  private melodyTimer?: number;
  private guqinIndex = 0;
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
    this.startStillWaterGuqin();
  }

  private startStillWaterGuqin() {
    const context = this.context!;
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let filtered = 0;
    for (let index = 0; index < samples.length; index += 1) {
      filtered = filtered * 0.96 + (Math.random() * 2 - 1) * 0.04;
      samples[index] = filtered * (0.56 + Math.sin(index / 1937) * 0.08);
    }

    const water = context.createBufferSource();
    const waterFilter = context.createBiquadFilter();
    const waterGain = context.createGain();
    water.buffer = buffer;
    water.loop = true;
    waterFilter.type = 'lowpass';
    waterFilter.frequency.value = 620;
    waterFilter.Q.value = 0.4;
    waterGain.gain.value = 0.08;
    water.connect(waterFilter).connect(waterGain).connect(this.musicGain!);
    water.start();
    this.ambientSources.push(water);

    const resonance = context.createOscillator();
    const resonanceGain = context.createGain();
    resonance.type = 'sine';
    resonance.frequency.value = 98;
    resonanceGain.gain.value = 0.016;
    resonance.connect(resonanceGain).connect(this.musicGain!);
    resonance.start();
    this.ambientSources.push(resonance);
    this.scheduleGuqin();
  }

  private scheduleGuqin() {
    if (!this.context || !this.musicGain) return;
    const phrase = [196, 261.63, 220, 293.66, 261.63, 329.63, 220, 196];
    this.playGuqinNote(phrase[this.guqinIndex % phrase.length]);
    this.guqinIndex += 1;
    this.melodyTimer = window.setTimeout(() => this.scheduleGuqin(), 4800 + Math.random() * 3200);
  }

  private playGuqinNote(frequency: number) {
    const context = this.context!;
    const now = context.currentTime;
    [1, 2, 3].forEach((harmonic, index) => {
      const string = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      string.type = index === 0 ? 'triangle' : 'sine';
      string.frequency.setValueAtTime(frequency * harmonic * 1.012, now);
      string.frequency.exponentialRampToValueAtTime(frequency * harmonic, now + 0.18);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600 - index * 520, now);
      filter.frequency.exponentialRampToValueAtTime(720, now + 2.8);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime([0.16, 0.048, 0.018][index], now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.6 - index * 0.55);
      string.connect(filter).connect(gain).connect(this.musicGain!);
      string.start(now);
      string.stop(now + 3.7);
    });
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
