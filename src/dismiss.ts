const KEY_EMERGENCY = "sf-dismiss-emergency";
const KEY_DISCLAIMER = "sf-dismiss-disclaimer";

export function isEmergencyDismissed(): boolean {
  return sessionStorage.getItem(KEY_EMERGENCY) === "1";
}

export function isDisclaimerDismissed(): boolean {
  return sessionStorage.getItem(KEY_DISCLAIMER) === "1";
}

export function dismissEmergency(): void {
  sessionStorage.setItem(KEY_EMERGENCY, "1");
}

export function dismissDisclaimer(): void {
  sessionStorage.setItem(KEY_DISCLAIMER, "1");
}

export function syncDisclaimerPaddingClass(): void {
  document.documentElement.classList.toggle(
    "no-disclaimer",
    isDisclaimerDismissed(),
  );
}
