/**
 * Zentrale Datentypen für ContentOS.
 *
 * Die Struktur ist bewusst so gewählt, dass sie 1:1 auf Supabase-Tabellen
 * abgebildet werden kann:
 *  - jede Entität hat eine `id` (später uuid)
 *  - jede markenbezogene Entität hat `brandId` (später FK auf brands.id)
 *  - Zeitstempel als ISO-String (später timestamptz)
 *  - `visibility` steuert, was Kundinnen später sehen dürfen
 */

/* ------------------------------------------------------------------ */
/* Mandanten / Marken                                                  */
/* ------------------------------------------------------------------ */

export type BrandId = string;

export interface Brand {
  id: BrandId;
  /** Kurzname für URLs, später auch Supabase-Slug */
  slug: string;
  name: string;
  /** Übergeordnetes Unternehmen – Vorbereitung für Mehrmandantenfähigkeit */
  organisation: string;
  accentColor: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Benutzer & Rollen (noch ohne echte Anmeldung)                       */
/* ------------------------------------------------------------------ */

export type UserRole = "admin" | "studio_kunde" | "premium_kunde";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Marken, auf die dieser Benutzer Zugriff hat */
  brandIds: BrandId[];
}

/** Was eine Rolle im System darf. Wird später gegen Supabase-RLS gespiegelt. */
export interface RolePermissions {
  /** Darf Inhalte in allen Status sehen (nicht nur freigegebene)? */
  seeAllStatuses: boolean;
  darfInhalteErstellen: boolean;
  darfFreigeben: boolean;
  darfAccountsVerwalten: boolean;
  darfMarkenwissenBearbeiten: boolean;
  darfVideoHerunterladen: boolean;
  darfStoryHerunterladen: boolean;
  darfCaptionKopieren: boolean;
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export type ContentStatus =
  | "idee"
  | "entwurf"
  | "freigegeben"
  | "produziert"
  | "veroeffentlicht";

export type Audience = "kosmetikerinnen" | "endkunden";

export type ContentGoal =
  | "reichweite"
  | "education"
  | "produktverkauf"
  | "behandlung_verkaufen"
  | "neue_studios"
  | "vertrauen"
  | "einwand";

export type ContentFormat = "reel" | "story" | "carousel" | "post";

/** Sichtbarkeit für spätere Kundenzugänge */
export type Visibility = "intern" | "kunde";

export interface TextOverlay {
  /** z. B. "0-2s" */
  zeit: string;
  text: string;
}

export interface ContentItem {
  id: string;
  brandId: BrandId;
  format: ContentFormat;
  audience: Audience;
  goal: ContentGoal;
  thema: string;
  produkt?: string;
  hook: string;
  brollIds: string[];
  brollHinweis: string;
  overlays: TextOverlay[];
  caption: string;
  cta: string;
  status: ContentStatus;
  visibility: Visibility;
  /** Optionaler Platz im Wochenplan */
  geplantFuer?: string; // ISO-Datum
  createdAt: string;
  updatedAt: string;
  /** Später: FK auf auth.users */
  createdBy: string;
}

/* ------------------------------------------------------------------ */
/* B-Roll                                                              */
/* ------------------------------------------------------------------ */

export interface BrollClip {
  id: string;
  brandId: BrandId;
  /** Sprechende Kennung wie B001 */
  code: string;
  titel: string;
  beschreibung: string;
  tags: string[];
  produkt?: string;
  kategorie: string;
  /** Später: Supabase-Storage-URL */
  videoUrl?: string;
  /** Platzhalterfarbe für die Vorschau, solange kein Video hinterlegt ist */
  vorschauFarbe: string;
  dauerSekunden: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Wochenplan                                                          */
/* ------------------------------------------------------------------ */

export type Wochentag =
  | "Montag"
  | "Dienstag"
  | "Mittwoch"
  | "Donnerstag"
  | "Freitag"
  | "Samstag"
  | "Sonntag";

export interface PlanEntry {
  id: string;
  brandId: BrandId;
  /** ISO-Woche im Format 2026-W37 – erlaubt später mehrere Wochen */
  kalenderwoche: string;
  tag: Wochentag;
  /** Verknüpfung zum Inhalt in der Bibliothek */
  contentId?: string;
  thema: string;
  goal: ContentGoal;
  status: ContentStatus;
  brollIds: string[];
  uhrzeit: string;
}

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

export interface TopThema {
  thema: string;
  /** Durchschnittliche Aufrufe der Beiträge zu diesem Thema */
  reichweite: number;
  anteilProzent: number;
}

export interface TopReel {
  titel: string;
  hook: string;
  aufrufe: number;
  likes: number;
  kommentare: number;
  format: string;
}

export interface ResearchResult {
  handle: string;
  analysiertAm: string;
  follower: number;
  postingFrequenz: string;
  durchschnittlicheAufrufe: number;
  topThemen: TopThema[];
  haeufigeHooks: string[];
  topReels: TopReel[];
  ctas: string[];
  formate: string[];
  chancenFuerSqt: string[];
  contentLuecken: string[];
}

export interface WatchedAccount {
  id: string;
  handle: string;
  beschreibung: string;
  kategorie: string;
  follower: number;
  hinzugefuegtAm: string;
  letzteAnalyse?: string;
}

export interface WochenReport {
  erstelltAm: string;
  analysierteAccounts: number;
  trends: string[];
  erfolgreicheThemen: string[];
  contentLuecken: string[];
  empfehlung: string;
}

/** Aus Research gespeicherte Hooks, wiederverwendbar beim Erstellen */
export interface SavedHook {
  id: string;
  brandId: BrandId;
  text: string;
  quelle: string;
  gespeichertAm: string;
}

/* ------------------------------------------------------------------ */
/* Markenwissen                                                        */
/* ------------------------------------------------------------------ */

export interface ProduktInfo {
  name: string;
  kurzbeschreibung: string;
  zielgruppe: Audience[];
}

export interface BrandKnowledge {
  brandId: BrandId;
  zielgruppe: string;
  tonalitaet: string[];
  produkte: ProduktInfo[];
  kernbotschaften: string[];
  woerterVermeiden: string[];
  standardCtas: string[];
  notizen: string;
  updatedAt: string;
}
