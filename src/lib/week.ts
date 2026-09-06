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
