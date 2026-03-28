/**
 * Chooses Ireland-specific vs international crisis copy.
 * Ireland: timezone Europe/Dublin or Irish locale tags (best-effort).
 * If detection fails, defaults to Irish numbers (project fallback).
 */

export function isIrelandContext(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Europe/Dublin") return true;

    const raw =
      navigator.languages?.length ? [...navigator.languages] : [navigator.language];
    const langs = raw.filter(Boolean);
    if (langs.length === 0) return true;

    return langs.some((l) => {
      const x = l.toLowerCase();
      return x.endsWith("-ie") || x === "ga" || x.startsWith("ga-");
    });
  } catch {
    return true;
  }
}

/** Home emergency strip (plain text inside HTML). */
export function emergencyStripBody(): string {
  if (isIrelandContext()) {
    return `<strong>Need urgent help?</strong> Severe breathing problems, serious injury, a first-ever episode, confusion that is unusual for you, or immediate danger—call emergency services: <strong>112</strong> or <strong>999</strong>. Mental health crisis: Samaritans <strong>116 123</strong>, text <strong>50808</strong>, or Pieta <strong>1800 247 247</strong>.`;
  }
  return `<strong>Need urgent help?</strong> Severe breathing problems, serious injury, a first-ever episode, confusion that is unusual for you, or immediate danger—use the <strong>emergency number where you are</strong>. On many mobile networks, <strong>112</strong> reaches emergency services; if unsure, use the emergency option your phone shows. For mental health crisis, find a <strong>local helpline</strong> (e.g. search “crisis helpline” plus your area) or see <a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer">Befrienders Worldwide</a>.`;
}

/** Emergency page: extra numbers / links block. */
export function emergencyPageLocalBlock(): string {
  if (isIrelandContext()) {
    return `<div class="card"><h2 class="h2-tight">Numbers in Ireland</h2><ul class="list-muted"><li>Emergency: <strong>112</strong> or <strong>999</strong></li><li>Samaritans: <strong>116 123</strong> (24/7)</li><li>Crisis text: <strong>50808</strong> (standard SMS rates may apply)</li><li>Pieta (self-harm / suicide): <strong>1800 247 247</strong></li></ul><p class="note-sm">Numbers are for Ireland only. If you are elsewhere, use local services.</p></div>`;
  }
  return `<div class="card"><h2 class="h2-tight">Finding numbers where you are</h2><ul class="list-muted"><li>Emergency: use the number for your country or region—often shown on your phone’s emergency screen; <strong>112</strong> works in many countries (including EU) on mobile.</li><li>Mental health crisis: search for a national or local crisis line, ask a clinician or pharmacist, or use <a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer">Befrienders Worldwide</a> to find support.</li></ul></div>`;
}

/** Aftercare resource list items (HTML fragments). */
export function aftercareResourceLinks(): string {
  if (isIrelandContext()) {
    return `<ul class="resource-list"><li><a href="https://www.epilepsy.ie/" target="_blank" rel="noopener noreferrer">Epilepsy Ireland</a></li><li><a href="https://www.ilae.org/" target="_blank" rel="noopener noreferrer">ILAE</a> (international epilepsy)</li><li><a href="https://neurosymptoms.org/" target="_blank" rel="noopener noreferrer">Neurosymptoms.org</a> (FND / functional seizures)</li><li><a href="https://www.samaritans.ie/" target="_blank" rel="noopener noreferrer">Samaritans Ireland</a> · <strong>116 123</strong></li><li><a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer">Befrienders Worldwide</a></li></ul>`;
  }
  return `<ul class="resource-list"><li><a href="https://www.ilae.org/" target="_blank" rel="noopener noreferrer">ILAE</a> (international epilepsy)</li><li><a href="https://neurosymptoms.org/" target="_blank" rel="noopener noreferrer">Neurosymptoms.org</a> (FND / functional seizures)</li><li><a href="https://www.befrienders.org/" target="_blank" rel="noopener noreferrer">Befrienders Worldwide</a> (crisis helplines by country)</li></ul>`;
}
