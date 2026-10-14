"use client";

const MUTED_KEY = "crystal_beauty_sound_muted";
const UNLOCKED_KEY = "crystal_beauty_audio_unlocked";

let audioCtx: AudioContext | null = null;
let listenersInitialized = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Resumes / unlocks the Web Audio API AudioContext on user interaction.
 * Crucial for iOS Safari, mobile Chrome, and installed PWAs which block autoplay.
 */
export async function unlockAudioContext(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // Play an ultra-short silent buffer to unlock hardware audio pipeline
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    try {
      sessionStorage.setItem(UNLOCKED_KEY, "true");
    } catch {}

    return ctx.state === "running";
  } catch (err) {
    console.warn("Audio unlock attempt failed:", err);
    return false;
  }
}

/**
 * Attaches passive gesture listeners once to unlock audio on first interaction.
 */
export function initAudioUnlockListeners() {
  if (typeof window === "undefined" || listenersInitialized) return;
  listenersInitialized = true;

  const unlock = async () => {
    const unlocked = await unlockAudioContext();
    if (unlocked) {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    }
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTED_KEY, muted ? "true" : "false");
  } catch {}
}

/**
 * Plays a signature, rich luxury store cash register & chime sound
 * Synthesized dynamically via Web Audio API so it never relies on external audio files
 * and works offline and in standalone PWAs without 404s.
 */
export async function playOrderChime(): Promise<void> {
  if (isSoundMuted()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {}

  const now = ctx.currentTime;

  // Sound design: Cash Register "Cha-Ching"
  // Part 1: Mechanical click / coin slide
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);

  // Part 2: Two bright resonant bells (Chime 1: ~987Hz [B5], Chime 2: ~1318Hz [E6])
  const playBellTone = (freq: number, startDelay: number, duration: number, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + startDelay);
    // Slight vibrato shimmer
    osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + startDelay + duration);

    gain.gain.setValueAtTime(0.001, now + startDelay);
    gain.gain.exponentialRampToValueAtTime(volume, now + startDelay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + startDelay);
    osc.stop(now + startDelay + duration);
  };

  // First bell
  playBellTone(987.77, 0.04, 0.45, 0.28);
  // Harmonic octave overtone
  playBellTone(1975.53, 0.04, 0.35, 0.08);

  // Second high bell ("Ching!")
  playBellTone(1318.51, 0.16, 0.75, 0.35);
  // Shimmer overtone
  playBellTone(2637.02, 0.16, 0.55, 0.1);
}
