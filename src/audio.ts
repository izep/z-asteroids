/**
 * Web Audio synthesizer — no audio files, no CDN assets.
 * All sounds are procedurally generated using the Web Audio API.
 */

export function createAudio() {
  let ctx: AudioContext | null = null;
  let muted = false;
  let thrustNode: OscillatorNode | null = null;
  let thrustGain: GainNode | null = null;
  let thrustActive = false;

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx;
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  /** Must be called on first user gesture to unlock AudioContext. */
  function resume(): void {
    const c = ensureContext();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => { /* ignore */ });
    }
  }

  function setMuted(m: boolean): void {
    muted = m;
    if (muted && thrustActive) stopThrust();
  }

  function isMuted(): boolean {
    return muted;
  }

  // ---- Fire "pew" ----
  function playFire(): void {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  }

  // ---- Explosion rumble ----
  function playExplosion(size: 'large' | 'medium' | 'small'): void {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const dur = size === 'large' ? 0.7 : size === 'medium' ? 0.45 : 0.25;
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const source = c.createBufferSource();
    source.buffer = buf;
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(size === 'large' ? 300 : 500, c.currentTime);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.6, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    source.start(c.currentTime);
  }

  // ---- Thrust hum (looped) ----
  function startThrust(): void {
    if (muted || thrustActive) return;
    const c = ensureContext();
    if (!c) return;
    thrustActive = true;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, c.currentTime);
    // slight random wobble
    osc.frequency.setValueAtTime(80 + Math.random() * 20, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.05);
    osc.start();
    thrustNode = osc;
    thrustGain = gain;
  }

  function stopThrust(): void {
    thrustActive = false;
    if (thrustGain && ctx) {
      thrustGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    }
    if (thrustNode) {
      thrustNode.stop(ctx ? ctx.currentTime + 0.1 : 0);
      thrustNode = null;
      thrustGain = null;
    }
  }

  // ---- Hyperspace swoop ----
  function playHyperspace(): void {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.4);
  }

  // ---- Wave clear chime ----
  function playWaveClear(): void {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = 'triangle';
      const t = c.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  return {
    resume,
    setMuted,
    isMuted,
    playFire,
    playExplosion,
    startThrust,
    stopThrust,
    playHyperspace,
    playWaveClear,
  };
}

export type AudioManager = ReturnType<typeof createAudio>;
