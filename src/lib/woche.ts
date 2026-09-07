// Hilfsfunktionen für die ISO-Kalenderwoche im Format 2026-W37.

export const WOCHENTAGE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

export type Wochentag = (typeof WOCHENTAGE)[number];

export function kalenderwocheVon(datum = new Date()): string {
  const kopie = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const wochentag = kopie.getUTCDay() || 7;
  kopie.setUTCDate(kopie.getUTCDate() + 4 - wochentag);
  const jahresbeginn = new Date(Date.UTC(kopie.getUTCFullYear(), 0, 1));
  const woche = Math.ceil(((kopie.getTime() - jahresbeginn.getTime()) / 86400000 + 1) / 7);
  return `${kopie.getUTCFullYear()}-W${String(woche).padStart(2, "0")}`;
}

// Der 4. Januar liegt per Definition immer in Kalenderwoche 1.
export function montagDerKalenderwoche(kalenderwoche: string): Date {
  const [jahrText, wocheText] = kalenderwoche.split("-W");
  const jahr = Number(jahrText);
  const woche = Number(wocheText);
  if (!Number.isFinite(jahr) || !Number.isFinite(woche)) return new Date();
  const vierterJanuar = new Date(jahr, 0, 4);
  const wochentag = (vierterJanuar.getDay() + 6) % 7;
  const montagWoche1 = new Date(vierterJanuar);
  montagWoche1.setDate(vierterJanuar.getDate() - wochentag);
  montagWoche1.setHours(0, 0, 0, 0);
  const ergebnis = new Date(montagWoche1);
  ergebnis.setDate(montagWoche1.getDate() + (woche - 1) * 7);
  return ergebnis;
}

export function wocheVerschieben(kalenderwoche: string, wochen: number): string {
  const montag = montagDerKalenderwoche(kalenderwoche);
  montag.setDate(montag.getDate() + wochen * 7);
  return kalenderwocheVon(montag);
}

export function datumInWoche(kalenderwoche: string, tag: string): Date {
  const montag = montagDerKalenderwoche(kalenderwoche);
  const index = Math.max(0, (WOCHENTAGE as readonly string[]).indexOf(tag));
  const ergebnis = new Date(montag);
  ergebnis.setDate(montag.getDate() + index);
  return ergebnis;
}

export function wochenBeschriftung(kalenderwoche: string): string {
  const montag = montagDerKalenderwoche(kalenderwoche);
  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  const kurz = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  const lang = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nummer = kalenderwoche.split("-W")[1] ?? "";
  return `KW ${nummer} · ${kurz.format(montag)} – ${lang.format(sonntag)}`;
}

export function istHeute(kalenderwoche: string, tag: string): boolean {
  const heute = new Date();
  const datum = datumInWoche(kalenderwoche, tag);
  return (
    datum.getFullYear() === heute.getFullYear() &&
    datum.getMonth() === heute.getMonth() &&
    datum.getDate() === heute.getDate()
  );
}
