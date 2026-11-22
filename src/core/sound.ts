// Procedural Web Audio API synthesizer — zero external audio files required.

class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(options: {
    freq: number;
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    delay?: number;
  }): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(options.freq, now);
    if (options.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, options.endFreq),
        now + options.duration
      );
    }

    const peak = options.gain ?? 0.08;
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(peak, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

    osc.connect(amp);
    amp.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + options.duration + 0.02);
  }

  public playSelect(): void {
    this.playTone({ freq: 520, endFreq: 660, duration: 0.11, type: 'triangle', gain: 0.07 });
    this.playTone({ freq: 780, duration: 0.12, type: 'sine', gain: 0.04, delay: 0.03 });
  }

  public playDeselect(): void {
    this.playTone({ freq: 440, endFreq: 310, duration: 0.1, type: 'triangle', gain: 0.055 });
  }

  public playError(): void {
    this.playTone({ freq: 170, endFreq: 110, duration: 0.16, type: 'sawtooth', gain: 0.06 });
  }

  public playBridgeCreak(): void {
    // Low timber creak + soft wind sweep
    this.playTone({ freq: 135, endFreq: 96, duration: 0.42, type: 'sawtooth', gain: 0.035 });
    this.playTone({ freq: 195, endFreq: 162, duration: 0.35, type: 'triangle', gain: 0.03, delay: 0.08 });
  }

  public playFootstep(stepIndex = 0): void {
    const base = stepIndex % 2 === 0 ? 155 : 132;
    this.playTone({ freq: base, endFreq: 68, duration: 0.07, type: 'triangle', gain: 0.045 });
  }

  public playLanternArrive(): void {
    this.playTone({ freq: 587.33, duration: 0.2, type: 'sine', gain: 0.065 });
    this.playTone({ freq: 880, duration: 0.28, type: 'triangle', gain: 0.045, delay: 0.06 });
  }

  public playHint(): void {
    this.playTone({ freq: 659.25, duration: 0.22, type: 'sine', gain: 0.05 });
    this.playTone({ freq: 987.77, duration: 0.3, type: 'sine', gain: 0.045, delay: 0.09 });
  }

  public playUndo(): void {
    this.playTone({ freq: 490, endFreq: 360, duration: 0.14, type: 'triangle', gain: 0.06 });
  }

  public playTensionTick(): void {
    this.playTone({ freq: 110, endFreq: 75, duration: 0.12, type: 'sine', gain: 0.07 });
  }

  public playVictory(): void {
    // Warm fantasy brass/harp arpeggio (D major 9)
    const notes = [293.66, 369.99, 440, 554.37, 587.33, 739.99];
    notes.forEach((freq, idx) => {
      this.playTone({
        freq,
        duration: idx === notes.length - 1 ? 0.9 : 0.36,
        type: idx % 2 === 0 ? 'triangle' : 'sine',
        gain: 0.075,
        delay: idx * 0.095,
      });
    });
  }

  public playCollapse(): void {
    // Dramatic rope snap + descending stone rumble
    this.playTone({ freq: 260, endFreq: 52, duration: 0.55, type: 'sawtooth', gain: 0.09 });
    this.playTone({ freq: 110, endFreq: 36, duration: 0.85, type: 'triangle', gain: 0.1, delay: 0.1 });
    this.playTone({ freq: 72, endFreq: 28, duration: 0.9, type: 'sine', gain: 0.11, delay: 0.22 });
  }

  public playOarStroke(stepIndex = 0): void {
    const startFreq = stepIndex % 2 === 0 ? 190 : 168;
    this.playTone({ freq: startFreq, endFreq: 95, duration: 0.22, type: 'sine', gain: 0.05 });
    this.playTone({ freq: 310, endFreq: 180, duration: 0.14, type: 'triangle', gain: 0.02, delay: 0.04 });
  }

  public playBoatDock(): void {
    this.playTone({ freq: 140, endFreq: 86, duration: 0.12, type: 'triangle', gain: 0.065 });
    this.playTone({ freq: 523.25, duration: 0.22, type: 'sine', gain: 0.045, delay: 0.05 });
  }

  public playLiquidFill(): void {
    // Rising crystalline water stream notes
    const freqs = [320, 410, 510, 620, 740];
    freqs.forEach((f, idx) => {
      this.playTone({
        freq: f,
        endFreq: f * 1.09,
        duration: 0.13,
        type: 'sine',
        gain: 0.045,
        delay: idx * 0.085,
      });
    });
  }

  public playLiquidPour(): void {
    // Flowing bubbling pour between crystal vessels
    const freqs = [460, 540, 490, 610, 680];
    freqs.forEach((f, idx) => {
      this.playTone({
        freq: f,
        endFreq: f * 1.12,
        duration: 0.12,
        type: 'triangle',
        gain: 0.04,
        delay: idx * 0.095,
      });
    });
  }

  public playLiquidDrain(): void {
    // Soft descending drain shimmer
    this.playTone({ freq: 480, endFreq: 190, duration: 0.34, type: 'sine', gain: 0.05 });
    this.playTone({ freq: 340, endFreq: 140, duration: 0.28, type: 'triangle', gain: 0.035, delay: 0.08 });
  }

  public playOracleSpeak(word: 'DA' | 'JA'): void {
    // Ethereal resonant chime — subtly different pitch color for DA vs JA
    const root = word === 'DA' ? 392 : 349.23;
    this.playTone({ freq: root, duration: 0.36, type: 'sine', gain: 0.065 });
    this.playTone({ freq: root * 1.5, duration: 0.42, type: 'triangle', gain: 0.04, delay: 0.06 });
  }

  public playOracleReveal(): void {
    this.playTone({ freq: 440, duration: 0.28, type: 'sine', gain: 0.06 });
    this.playTone({ freq: 659.25, duration: 0.36, type: 'triangle', gain: 0.05, delay: 0.08 });
  }

  public playDoorUnseal(): void {
    // Deep metallic bolt slide + bronze hinge groan
    this.playTone({ freq: 185, endFreq: 112, duration: 0.28, type: 'triangle', gain: 0.065 });
    this.playTone({ freq: 310, endFreq: 240, duration: 0.14, type: 'sine', gain: 0.04, delay: 0.06 });
  }

  public playVaultKey(): void {
    // Crisp golden Astral Key discovery chime
    this.playTone({ freq: 523.25, duration: 0.2, type: 'sine', gain: 0.07 });
    this.playTone({ freq: 659.25, duration: 0.24, type: 'triangle', gain: 0.06, delay: 0.07 });
    this.playTone({ freq: 783.99, duration: 0.35, type: 'sine', gain: 0.06, delay: 0.14 });
  }

  public playEmptyTrap(): void {
    // Hollow stone echo
    this.playTone({ freq: 165, endFreq: 98, duration: 0.32, type: 'triangle', gain: 0.065 });
    this.playTone({ freq: 118, endFreq: 74, duration: 0.36, type: 'sine', gain: 0.055, delay: 0.09 });
  }

  public playStreetStep(isNegativeTax = false): void {
    // Soft stone step with crisp coin/chime tint
    this.playTone({
      freq: isNegativeTax ? 460 : 340,
      endFreq: isNegativeTax ? 520 : 290,
      duration: 0.09,
      type: 'triangle',
      gain: 0.055,
    });
  }
}

export const soundEngine = new ProceduralSoundEngine();

