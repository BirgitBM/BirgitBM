import type { Wochentag } from "./types";

export const WOCHENTAGE: Wochentag[] = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

/** Montag der Woche, in der das übergebene Datum liegt. */
export function montagDerWoche(datum = new Date()): Date {
  const kopie = new Date(datum);
  const wochentag = (kopie.getDay() + 6) % 7; // Montag = 0
  kopie.setDate(kopie.getDate() - wochentag);
  kopie.setHours(0, 0, 0, 0);
  return kopie;
}

export function datumFuerTag(tag: Wochentag, basis = new Date()): Date {
  const montag = montagDerWoche(basis);
  const index = WOCHENTAGE.indexOf(tag);
  const ergebnis = new Date(montag);
  ergebnis.setDate(montag.getDate() + (index < 0 ? 0 : index));
  return ergebnis;
}

/** ISO-Kalenderwoche im Format 2026-W37. */
export function kalenderwocheVon(datum = new Date()): string {
  const kopie = new Date(
    Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()),
  );
  const wochentag = kopie.getUTCDay() || 7;
  kopie.setUTCDate(kopie.getUTCDate() + 4 - wochentag);
  const jahresbeginn = new Date(Date.UTC(kopie.getUTCFullYear(), 0, 1));
  const woche = Math.ceil(
    ((kopie.getTime() - jahresbeginn.getTime()) / 86400000 + 1) / 7,
  );
  return `${kopie.getUTCFullYear()}-W${String(woche).padStart(2, "0")}`;
}

export function istHeute(tag: Wochentag): boolean {
  return WOCHENTAGE[(new Date().getDay() + 6) % 7] === tag;
}

/**
 * Montag einer ISO-Kalenderwoche im Format 2026-W36.
 *
 * Grundlage: Der 4. Januar liegt per Definition immer in Kalenderwoche 1.
 */
export function montagDerKalenderwoche(kalenderwoche: string): Date {
  const [jahrText, wocheText] = kalenderwoche.split("-W");
  const jahr = Number(jahrText);
  const woche = Number(wocheText);
  if (!Number.isFinite(jahr) || !Number.isFinite(woche)) {
    return montagDerWoche();
  }
  const vierterJanuar = new Date(jahr, 0, 4);
  const wochentag = (vierterJanuar.getDay() + 6) % 7;
  const montagWoche1 = new Date(vierterJanuar);
  montagWoche1.setDate(vierterJanuar.getDate() - wochentag);
  montagWoche1.setHours(0, 0, 0, 0);
  const ergebnis = new Date(montagWoche1);
  ergebnis.setDate(montagWoche1.getDate() + (woche - 1) * 7);
  return ergebnis;
}

/** Verschiebt eine Kalenderwoche um die angegebene Anzahl Wochen. */
export function wocheVerschieben(kalenderwoche: string, wochen: number): string {
  const montag = montagDerKalenderwoche(kalenderwoche);
  montag.setDate(montag.getDate() + wochen * 7);
  return kalenderwocheVon(montag);
}

/** Datum eines Wochentags innerhalb einer bestimmten Kalenderwoche. */
export function datumInWoche(kalenderwoche: string, tag: Wochentag): Date {
  const montag = montagDerKalenderwoche(kalenderwoche);
  const ergebnis = new Date(montag);
  ergebnis.setDate(montag.getDate() + Math.max(0, WOCHENTAGE.indexOf(tag)));
  return ergebnis;
}

/** Lesbare Beschriftung wie "KW 36 · 31.08. – 06.09.2026". */
export function wochenBeschriftung(kalenderwoche: string): string {
  const montag = montagDerKalenderwoche(kalenderwoche);
  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  const kurz = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
  const lang = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const nummer = kalenderwoche.split("-W")[1] ?? "";
  return `KW ${nummer} · ${kurz.format(montag)} – ${lang.format(sonntag)}`;
}
