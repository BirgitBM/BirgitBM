// Zentrale Datenmodelle für ContentOS.
// Diese Typen sind bewusst so geschnitten, dass sie später 1:1 auf
// Supabase-Tabellen abgebildet werden können (id als string/uuid,
// flache Felder statt verschachtelter Objekte, ISO-Datumsstrings).

export type Marke = "SQT B2B" | "SQT Homecare" | "Exoprime" | "Haut Zentrum";

export type Zielgruppe = "Kosmetikerinnen" | "Endkunden";

export type ContentZiel =
  | "Reichweite"
  | "Education"
  | "Produktverkauf"
  | "Behandlung verkaufen"
  | "neue Studios gewinnen"
  | "Vertrauen"
  | "Einwand beantworten";

export type ContentStatus =
  | "Idee"
  | "Entwurf"
  | "Freigegeben"
  | "Produziert"
  | "Veröffentlicht";

export type ContentArt = "Reel" | "Carousel" | "Story" | "Single Post";

// Vorbereitet für spätere Kundenfunktionen. Wird in Version 1 nirgends
// zur Rechtevergabe ausgewertet, nur als Datenfeld mitgeführt.
export type UserRole = "admin" | "studio-kunde" | "premium-kunde";

export interface TextOverlay {
  zeit: string; // z.B. "0:00–0:03"
  text: string;
}

export interface ReelCard {
  id: string;
  marke: Marke;
  zielgruppe: Zielgruppe;
  ziel: ContentZiel;
  thema: string;
  produkt?: string;
  hook: string;
  brollEmpfehlung: string;
  textOverlays: TextOverlay[];
  caption: string;
  cta: string;
  status: ContentStatus;
  contentArt: ContentArt;
  erstelltAm: string; // ISO-Datum
  // Steuert, ob ein Inhalt später für Kunden-Logins sichtbar wäre.
  freigegebenFuerKunden: boolean;
}

export interface BRollClip {
  id: string;
  titel: string;
  beschreibung: string;
  tags: string[];
  produkt?: string;
  kategorie: string;
}

export interface WochenplanEintrag {
  id: string;
  tag: string; // "Montag" ... "Freitag"
  thema: string;
  ziel: ContentZiel;
  status: ContentStatus;
  brollId?: string;
  reelId?: string;
}

export interface InstagramAnalyse {
  account: string;
  erfolgreichsteThemen: string[];
  haeufigsteHooks: string[];
  erfolgreichsteReels: { titel: string; kennzahl: string }[];
  postingFrequenz: string;
  verwendeteCtas: string[];
  wiederkehrendeFormate: string[];
  contentChancenFuerSqt: string[];
  contentLuecken: string[];
}

export interface BeobachteterAccount {
  id: string;
  handle: string;
  hinzugefuegtAm: string;
  letzteAnalyse?: string;
}

export interface MarkeninfoEintrag {
  marke: Marke;
  zielgruppe: string;
  tonalitaet: string;
  produkte: string[];
}
