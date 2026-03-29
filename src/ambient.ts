/**
 * Relaxation-oriented mix: low-frequency consonant tones (octave and fifth)
 * plus band-limited brown noise. Sound is on by default; playback starts on
 * the first tap or click (browser autoplay policy). Turning sound off is remembered for the session.
 */

const STORAGE_OFF = "sf-ambient-off";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let graphBuilt = false;
let active = false;
let noiseSource: AudioBufferSourceNode | null = null;

export function isAmbientActive(): boolean {
  return active;
}

/** User has not opted out this session; header shows sound as intended on. */
export function isAmbientPreferredOn(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_OFF) !== "1";
  } catch {
    return true;
  }
}

function notifyAmbient(): void {
  window.dispatchEvent(new Event("sf-ambient"));
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 3;
  const bufferSize = seconds * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 4.2;
  }
  return buffer;
}

function buildGraph(): void {
  if (graphBuilt || !audioCtx) return;
  const ctx = audioCtx;
  masterGain = ctx.createGain();
  masterGain.gain.value = 0;

  filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.65;

  const root = 110;
  const fifth = root * 1.5;
  const octave = root * 2;
  const freqs = [root, fifth, octave];

  for (const f of freqs) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(masterGain);
    o.start();
  }

  const noiseBuf = createBrownNoiseBuffer(ctx);
  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuf;
  noiseSource.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.024;
  noiseSource.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();

  masterGain.connect(filter);
  filter.connect(ctx.destination);
  graphBuilt = true;
}

export async function resumeContext(): Promise<void> {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") await audioCtx.resume();
}

export async function startAmbient(): Promise<void> {
  await resumeContext();
  if (!audioCtx) return;
  buildGraph();
  if (!masterGain) return;
  const t = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0), t);
  masterGain.gain.linearRampToValueAtTime(0.105, t + 3.2);
  active = true;
  notifyAmbient();
}

export function stopAmbient(): void {
  if (!audioCtx || !masterGain) {
    active = false;
    notifyAmbient();
    return;
  }
  const t = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(masterGain.gain.value, t);
  masterGain.gain.linearRampToValueAtTime(0, t + 1.6);
  active = false;
  notifyAmbient();
}

export async function toggleAmbient(): Promise<boolean> {
  if (active) {
    try {
      sessionStorage.setItem(STORAGE_OFF, "1");
    } catch {
      /* ignore */
    }
    stopAmbient();
    return false;
  }
  try {
    sessionStorage.removeItem(STORAGE_OFF);
  } catch {
    /* ignore */
  }
  await startAmbient();
  return true;
}

function onFirstUserActivation(ev: Event): void {
  const t = (ev.target as HTMLElement | null)?.closest?.(
    '[data-action="toggle-ambient"]',
  );
  if (t) {
    document.removeEventListener("pointerdown", onFirstUserActivation, true);
    document.removeEventListener("click", onFirstUserActivation, true);
    return;
  }
  document.removeEventListener("pointerdown", onFirstUserActivation, true);
  document.removeEventListener("click", onFirstUserActivation, true);
  if (!isAmbientPreferredOn() || active) return;
  void startAmbient();
}

document.addEventListener("pointerdown", onFirstUserActivation, { capture: true });
document.addEventListener("click", onFirstUserActivation, { capture: true });

document.addEventListener("visibilitychange", () => {
  if (!audioCtx) return;
  if (document.visibilityState === "hidden") {
    void audioCtx.suspend().catch(() => {});
  } else if (active) {
    void audioCtx.resume().catch(() => {});
  }
});
