const INHALE_MS = 4000;
const EXHALE_MS = 6000;

export type BreathingHandlers = {
  onBack?: () => void;
  onNext?: () => void;
  showFlowNav?: boolean;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function navHtml(h: BreathingHandlers): string {
  if (!h.onBack && !h.onNext) return "";
  const nextLabel = h.showFlowNav ? "Next step" : "Continue";
  const back = h.onBack
    ? `<button type="button" class="btn btn--secondary" data-action="back">Back</button>`
    : "";
  const next = h.onNext
    ? `<button type="button" class="btn btn--primary" data-action="next">${nextLabel}</button>`
    : "";
  return `<div class="btn-row">${back}${next}</div>`;
}

export function mountBreathing(
  root: HTMLElement,
  handlers: BreathingHandlers = {},
): () => void {
  const reduced = prefersReducedMotion();
  let phase: "inhale" | "exhale" = "inhale";
  let phaseEnd = performance.now() + INHALE_MS;
  let raf = 0;
  let soundOn = false;
  let audioCtx: AudioContext | null = null;

  root.innerHTML = "";
  const el = document.createElement("div");
  el.className = "breathing-root";

  el.innerHTML = `
    <h1>Slow breathing</h1>
    <p class="lead">In through your nose if you can. Let the out-breath be slightly longer.</p>
    <div class="breath-stage">
      <div class="breath-orbit ${reduced ? "breath-orbit--static" : ""}" data-phase="exhale" role="img" aria-label="Breathing pace"></div>
      <div class="breath-label" id="breath-phase" aria-live="polite">Inhale</div>
      <div class="breath-count" id="breath-sec" aria-hidden="true"></div>
      <p class="breath-hint" id="breath-hint"></p>
    </div>
    <div class="toggle-row">
      <input type="checkbox" id="breath-sound" />
      <label for="breath-sound">Soft tone when phases change (optional)</label>
    </div>
    ${navHtml(handlers)}
  `;

  root.appendChild(el);

  const orbit = el.querySelector<HTMLDivElement>(".breath-orbit")!;
  const phaseEl = el.querySelector("#breath-phase")!;
  const secEl = el.querySelector("#breath-sec")!;
  const hintEl = el.querySelector("#breath-hint")!;
  const soundCb = el.querySelector<HTMLInputElement>("#breath-sound")!;

  function phaseDuration(p: "inhale" | "exhale"): number {
    return p === "inhale" ? INHALE_MS : EXHALE_MS;
  }

  function softChime(): void {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = phase === "inhale" ? 392 : 330;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      /* ignore */
    }
  }

  function setPhase(next: "inhale" | "exhale"): void {
    phase = next;
    phaseEnd = performance.now() + phaseDuration(phase);
    phaseEl.textContent = phase === "inhale" ? "Inhale" : "Exhale";
    orbit.dataset.phase = phase;
    if (reduced) {
      orbit.classList.add("breath-orbit--static");
      hintEl.textContent =
        phase === "inhale" ? "~4s in, gently." : "~6s out, slowly.";
    } else {
      hintEl.textContent = "";
    }
    softChime();
  }

  function tick(now: number): void {
    const remaining = Math.max(0, Math.ceil((phaseEnd - now) / 1000));
    secEl.textContent =
      reduced || remaining > 0 ? String(remaining) : "";

    if (now >= phaseEnd) {
      setPhase(phase === "inhale" ? "exhale" : "inhale");
    }
    raf = requestAnimationFrame(tick);
  }

  setPhase("inhale");
  raf = requestAnimationFrame(tick);

  soundCb.addEventListener("change", () => {
    soundOn = soundCb.checked;
    if (soundOn && !audioCtx) {
      void new AudioContext().resume().catch(() => {});
    }
  });

  el.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest("[data-action]");
    if (!t) return;
    const a = t.getAttribute("data-action");
    if (a === "back") handlers.onBack?.();
    if (a === "next") handlers.onNext?.();
  });

  return () => {
    cancelAnimationFrame(raf);
    if (audioCtx) void audioCtx.close();
  };
}
