import "./style.css";
import {
  parseHash,
  setHash,
  type View,
  getFlowStep,
  setFlowStep,
  resetFlow,
} from "./state.ts";
import { mountBreathing } from "./breathing.ts";
import { mountGrounding } from "./grounding.ts";
import {
  syncDisclaimerPaddingClass,
  dismissEmergency,
  dismissDisclaimer,
  isEmergencyDismissed,
  isDisclaimerDismissed,
} from "./dismiss.ts";
import {
  emergencyStripBody,
  emergencyPageLocalBlock,
  aftercareResourceLinks,
} from "./region.ts";
import {
  isAmbientActive,
  isAmbientPreferredOn,
  toggleAmbient,
} from "./ambient.ts";

let breatheUnmount: (() => void) | null = null;

function ambientUiPressed(): boolean {
  return isAmbientActive() || isAmbientPreferredOn();
}

function syncAmbientUi(root: HTMLElement): void {
  root.querySelectorAll('[data-action="toggle-ambient"]').forEach((btn) => {
    btn.setAttribute("aria-pressed", ambientUiPressed() ? "true" : "false");
  });
}

function clearBreathing(): void {
  breatheUnmount?.();
  breatheUnmount = null;
}

function emergencyStrip(): string {
  if (isEmergencyDismissed()) return "";
  return `<div class="emergency-strip dismissible" data-dismissible role="region" aria-label="When to get urgent help"><button type="button" class="dismiss-btn" data-dismiss="emergency" aria-label="Dismiss this notice">×</button>${emergencyStripBody()}</div>`;
}

function disclaimer(): string {
  if (isDisclaimerDismissed()) return "";
  return `<footer class="disclaimer dismissible" role="contentinfo"><button type="button" class="dismiss-btn" data-dismiss="disclaimer" aria-label="Dismiss legal notice">×</button><p>Wellness ideas only. Not medical advice or diagnosis. For emergencies, use local emergency services. Background sound is on by default after your first tap or click; use the Sound control to mute. Use your device volume if you want it quieter. Follow your own care plan.</p></footer>`;
}

function siteHeader(): string {
  const soundOn = ambientUiPressed();
  return `<header class="site-header" role="banner"><div class="site-header__inner"><button type="button" class="site-brand" data-action="brand-home"><img class="site-brand__logo" src="/logo.svg" width="44" height="44" alt="" decoding="async" /><span class="site-brand__text"><span class="site-brand__name">Seizure-Free</span><span class="site-brand__tag">Breathing · grounding · help</span></span></button><button type="button" class="ambient-toggle" data-action="toggle-ambient" aria-pressed="${soundOn ? "true" : "false"}" title="Sound on by default after first tap. Tap to mute or unmute. Use device volume to change level." aria-label="Background sound"><span class="ambient-toggle__glyph" aria-hidden="true">～</span><span class="ambient-toggle__text">Sound</span></button></div></header>`;
}

function layout(mainHtml: string, opts: { homeEmergency?: boolean } = {}): string {
  const top = opts.homeEmergency ? emergencyStrip() : "";
  return `<a class="skip-link" href="#main">Skip to main content</a><div class="shell">${siteHeader()}${top}<main id="main">${mainHtml}</main></div>${disclaimer()}`;
}

function renderHome(root: HTMLElement): void {
  clearBreathing();
  root.innerHTML = layout(
    `<h1>Take a minute</h1><p class="lead">If stress or an early warning hits your body, this app gives simple steps: breathing, grounding, and a way to get your bearings. It does not replace your doctor or clinician.</p><div class="stack"><button type="button" class="btn btn--primary" data-go="flow" style="width:100%">Start</button><button type="button" class="btn btn--secondary" data-go="breathe" style="width:100%">Breathing</button><button type="button" class="btn btn--secondary" data-go="ground" style="width:100%">Grounding</button><button type="button" class="btn btn--outline" data-go="emergency" style="width:100%">Emergency info</button></div>`,
    { homeEmergency: true },
  );
}

function renderEmergency(root: HTMLElement): void {
  clearBreathing();
  root.innerHTML = layout(
    `<h1>Emergency</h1><p class="lead">If something feels physically unsafe, use emergency services where you are.</p><div class="card"><h2 class="h2-tight">Call emergency services if</h2><ul class="list-muted"><li>First seizure-like episode without evaluation.</li><li>Episode longer than usual for you, or breathing / color worries you.</li><li>Serious injury, pregnancy concern, or life-threatening situation.</li></ul></div>${emergencyPageLocalBlock()}<div class="btn-row"><button type="button" class="btn btn--secondary" data-go="home">Home</button></div>`,
  );
}

function renderOrient(root: HTMLElement): void {
  clearBreathing();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const flow = parseHash() === "flow" && getFlowStep() === "orient";
  root.innerHTML = layout(
    `<h1>Orient</h1><p class="lead">Say where you are and what day it is. Small anchors when things feel unreal.</p><div class="card"><div class="field"><label for="orient-where">Where are you?</label><input type="text" id="orient-where" autocomplete="street-address" placeholder="Room, building, area" /></div><div class="field"><label for="orient-when">Today's date</label><input type="text" id="orient-when" /></div><div class="field"><label for="orient-who">Someone you could contact (optional)</label><input type="text" id="orient-who" autocomplete="off" placeholder="Name" /></div></div><div class="btn-row">${flow ? `<button type="button" class="btn btn--secondary" data-action="orient-back">Back</button>` : `<button type="button" class="btn btn--secondary" data-action="orient-home">Home</button>`}<button type="button" class="btn btn--primary" data-action="orient-next">${flow ? "Next" : "Aftercare"}</button></div>`,
  );
  const whenInput = root.querySelector<HTMLInputElement>("#orient-when");
  if (whenInput) whenInput.value = today;
}

function renderAftercare(root: HTMLElement): void {
  clearBreathing();
  root.innerHTML = layout(
    `<h1>Aftercare</h1><p class="lead">Take your time. Let your body settle.</p><div class="card"><ul class="list-muted"><li>Sip water if you can.</li><li>Rest somewhere safe; wait on stairs or very hot water until you feel steady.</li><li>Reach out to someone if it helps you feel safer.</li><li>Soft light and quiet help right now.</li></ul></div><h2>Resources</h2>${aftercareResourceLinks()}<p class="note-sm">What you feel in your body is real. Your doctor can help sort causes; therapy can help with trauma when that fits. You can ask for both.</p><div class="btn-row"><button type="button" class="btn btn--primary" data-action="after-home">Home</button></div>`,
  );
}

function renderFlow(root: HTMLElement): void {
  const step = getFlowStep();
  if (step === "breathe") {
    root.innerHTML = layout("");
    const main = root.querySelector<HTMLElement>("#main")!;
    breatheUnmount = mountBreathing(main, {
      showFlowNav: true,
      onBack: () => {
        resetFlow();
        setHash("home");
      },
      onNext: () => {
        setFlowStep("ground");
        render();
      },
    });
    return;
  }
  if (step === "ground") {
    root.innerHTML = layout("");
    mountGrounding(root.querySelector<HTMLElement>("#main")!, {
      showFlowNav: true,
      onBack: () => {
        setFlowStep("breathe");
        render();
      },
      onNext: () => {
        setFlowStep("orient");
        render();
      },
    });
    return;
  }
  if (step === "orient") {
    renderOrient(root);
    return;
  }
  if (step === "aftercare") {
    renderAftercare(root);
    return;
  }
}

function renderBreatheStandalone(root: HTMLElement): void {
  root.innerHTML = layout("");
  breatheUnmount = mountBreathing(root.querySelector<HTMLElement>("#main")!, {
    onBack: () => setHash("home"),
    onNext: () => setHash("aftercare"),
  });
}

function renderGroundStandalone(root: HTMLElement): void {
  root.innerHTML = layout("");
  mountGrounding(root.querySelector<HTMLElement>("#main")!, {
    onBack: () => setHash("home"),
    onNext: () => setHash("orient"),
  });
}

function render(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  syncDisclaimerPaddingClass();
  clearBreathing();
  const view = parseHash();

  switch (view) {
    case "home":
      renderHome(root);
      break;
    case "emergency":
      renderEmergency(root);
      break;
    case "flow":
      renderFlow(root);
      break;
    case "breathe":
      renderBreatheStandalone(root);
      break;
    case "ground":
      renderGroundStandalone(root);
      break;
    case "orient":
      renderOrient(root);
      break;
    case "aftercare":
      renderAftercare(root);
      break;
    default:
      renderHome(root);
  }
  syncAmbientUi(root);
}

function onAppClick(e: MouseEvent): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root?.contains(e.target as Node)) return;
  const t = e.target as HTMLElement;

  const dismissBtn = t.closest("[data-dismiss]");
  if (dismissBtn) {
    const kind = dismissBtn.getAttribute("data-dismiss");
    if (kind === "emergency") {
      dismissEmergency();
      dismissBtn.closest("[data-dismissible]")?.remove();
    }
    if (kind === "disclaimer") {
      dismissDisclaimer();
      dismissBtn.closest(".disclaimer")?.remove();
      syncDisclaimerPaddingClass();
    }
    return;
  }

  if (t.closest(".breathing-root") || t.closest(".grounding-root")) return;

  const go = t.closest("[data-go]")?.getAttribute("data-go") as View | undefined;
  if (go) {
    const v = parseHash();
    if (v === "home") {
      if (go === "flow") {
        resetFlow();
        setHash("flow");
      } else setHash(go);
    } else if (v === "emergency" && go === "home") setHash("home");
    return;
  }

  const action = t.closest("[data-action]")?.getAttribute("data-action");
  if (!action) return;

  if (action === "toggle-ambient") {
    void toggleAmbient().then(() => {
      const r = document.querySelector<HTMLElement>("#app");
      if (r) syncAmbientUi(r);
    });
    return;
  }
  if (action === "brand-home") {
    resetFlow();
    setHash("home");
    return;
  }
  if (action === "after-home") {
    setHash("home");
    return;
  }
  if (action === "orient-home") {
    setHash("home");
    return;
  }
  if (action === "orient-back") {
    setFlowStep("ground");
    setHash("flow");
    return;
  }
  if (action === "orient-next") {
    if (parseHash() === "flow") {
      setFlowStep("aftercare");
      setHash("flow");
    } else setHash("aftercare");
  }
}

const appEl = document.querySelector<HTMLElement>("#app");
if (appEl) appEl.addEventListener("click", onAppClick);

window.addEventListener("hashchange", render);

window.addEventListener("sf-ambient", () => {
  const app = document.querySelector<HTMLElement>("#app");
  if (app) syncAmbientUi(app);
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

render();
