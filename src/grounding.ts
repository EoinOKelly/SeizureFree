import { setHash } from "./state.ts";

const STEPS: { sense: string; count: number; hint: string }[] = [
  {
    sense: "see",
    count: 5,
    hint: "Five things you see. Any small detail counts.",
  },
  {
    sense: "touch / feel",
    count: 4,
    hint: "Four sensations: feet on the floor, fabric, air, something you can touch.",
  },
  {
    sense: "hear",
    count: 3,
    hint: "Three sounds, near or far.",
  },
  {
    sense: "smell",
    count: 2,
    hint: "Two smells, even faint, or two you would notice up close.",
  },
  {
    sense: "taste",
    count: 1,
    hint: "One taste now, or a sip of water.",
  },
];

export type GroundingHandlers = {
  onBack?: () => void;
  onNext?: () => void;
  showFlowNav?: boolean;
};

export function mountGrounding(
  root: HTMLElement,
  handlers: GroundingHandlers = {},
): void {
  root.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "grounding-root";
  let stepIndex = 0;

  function navButtons(): string {
    const back =
      stepIndex > 0
        ? `<button type="button" class="btn btn--secondary" data-nav="prev">Previous</button>`
        : handlers.onBack
          ? `<button type="button" class="btn btn--secondary" data-nav="back">Back</button>`
          : "";

    const next =
      stepIndex < STEPS.length - 1
        ? `<button type="button" class="btn btn--primary" data-nav="next">Next</button>`
        : handlers.onNext
          ? `<button type="button" class="btn btn--primary" data-nav="done">${handlers.showFlowNav ? "Next step" : "Continue"}</button>`
          : `<button type="button" class="btn btn--primary" data-nav="home">Home</button>`;

    return `<div class="btn-row">${back}${next}</div>`;
  }

  function render(): void {
    const s = STEPS[stepIndex]!;
    wrap.innerHTML = `
      <h1>Grounding</h1>
      <p class="lead">5-4-3-2-1: one sense at a time. Any answer is fine.</p>
      <div class="card">
        <div class="grounding-step-num">Step ${stepIndex + 1} of ${STEPS.length} · ${s.count} · ${s.sense}</div>
        <p class="ground-step-text">${s.hint}</p>
        <div class="field">
          <label for="g-notes">Notes (optional)</label>
          <textarea id="g-notes" maxlength="400" rows="3" placeholder="A few words if it helps" autocomplete="off"></textarea>
        </div>
      </div>
      ${navButtons()}
    `;
  }

  render();
  root.appendChild(wrap);

  wrap.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-nav]");
    if (!btn) return;
    const nav = btn.getAttribute("data-nav");
    if (nav === "prev") {
      stepIndex = Math.max(0, stepIndex - 1);
      render();
      return;
    }
    if (nav === "next") {
      stepIndex = Math.min(STEPS.length - 1, stepIndex + 1);
      render();
      return;
    }
    if (nav === "back") {
      handlers.onBack?.();
      return;
    }
    if (nav === "done") {
      handlers.onNext?.();
      return;
    }
    if (nav === "home") setHash("home");
  });
}
