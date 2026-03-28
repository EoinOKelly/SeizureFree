export type View =
  | "home"
  | "breathe"
  | "ground"
  | "orient"
  | "aftercare"
  | "emergency"
  | "flow";

export type FlowStep = "breathe" | "ground" | "orient" | "aftercare";

let flowStep: FlowStep = "breathe";

export function getFlowStep(): FlowStep {
  return flowStep;
}

export function setFlowStep(step: FlowStep): void {
  flowStep = step;
}

export function resetFlow(): void {
  flowStep = "breathe";
}

export function parseHash(): View {
  const h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (
    h === "breathe" ||
    h === "ground" ||
    h === "orient" ||
    h === "aftercare" ||
    h === "emergency" ||
    h === "flow"
  ) {
    return h;
  }
  return "home";
}

export function setHash(view: View): void {
  if (view === "home") {
    window.location.hash = "";
  } else {
    window.location.hash = view;
  }
}
