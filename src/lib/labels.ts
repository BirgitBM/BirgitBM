import type {
  Audience,
  ContentFormat,
  ContentGoal,
  ContentStatus,
  UserRole,
  Visibility,
} from "./types";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  idee: "Idee",
  entwurf: "Entwurf",
  freigegeben: "Freigegeben",
  produziert: "Produziert",
  veroeffentlicht: "Veröffentlicht",
};

export const STATUS_REIHENFOLGE: ContentStatus[] = [
  "idee",
  "entwurf",
  "freigegeben",
  "produziert",
  "veroeffentlicht",
];

/** Tailwind-Klassen pro Status – zentral, damit Farben überall gleich sind. */
export const STATUS_STYLES: Record<ContentStatus, string> = {
  idee: "bg-slate-100 text-slate-700 ring-slate-200",
  entwurf: "bg-amber-50 text-amber-700 ring-amber-200",
  freigegeben: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  produziert: "bg-sky-50 text-sky-700 ring-sky-200",
  veroeffentlicht: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const GOAL_LABELS: Record<ContentGoal, string> = {
  reichweite: "Reichweite",
  education: "Education",
  produktverkauf: "Produktverkauf",
  behandlung_verkaufen: "Behandlung verkaufen",
  neue_studios: "Neue Studios gewinnen",
  vertrauen: "Vertrauen",
  einwand: "Einwand beantworten",
};

export const GOAL_REIHENFOLGE: ContentGoal[] = [
  "reichweite",
  "education",
  "produktverkauf",
  "behandlung_verkaufen",
  "neue_studios",
  "vertrauen",
  "einwand",
];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  kosmetikerinnen: "Kosmetikerinnen",
  endkunden: "Endkunden",
};

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  reel: "Reel",
  story: "Story",
  carousel: "Carousel",
  post: "Post",
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  intern: "Intern",
  kunde: "Für Kunden sichtbar",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  studio_kunde: "Studio-Kunde",
  premium_kunde: "Premium-Kunde",
};

export function formatZahl(wert: number): string {
  return new Intl.NumberFormat("de-DE").format(wert);
}

export function formatDatum(iso: string): string {
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(datum);
}

export function formatDatumKurz(iso: string): string {
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
  }).format(datum);
}
