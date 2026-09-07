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
  // Freitext-Hinweis zur Bildsprache.
  brollEmpfehlung: string;
  // Konkret zugeordnete Clips aus der B-Roll-Bibliothek.
  brollIds: string[];
  textOverlays: TextOverlay[];
  caption: string;
  cta: string;
  status: ContentStatus;
  contentArt: ContentArt;
  erstelltAm: string; // ISO-Datum
  geaendertAm: string; // ISO-Zeitstempel
  // Steuert, ob ein Inhalt später für Kunden-Logins sichtbar wäre.
  freigegebenFuerKunden: boolean;
}

// Wem gehört ein Clip?
//   "marke" – gehört SQT, alle sehen ihn
//   "kunde" – gehört einer einzelnen Kundin, nur sie sieht ihn
export type BRollBesitzer = "marke" | "kunde";

export interface BRollClip {
  id: string;
  titel: string;
  beschreibung: string;
  tags: string[];
  produkt?: string;
  kategorie: string;
  besitzer: BRollBesitzer;
  besitzerUserId?: string;
  dauerSekunden: number;
  vorschauFarbe: string;
}

// Persönliche Clip-Auswahl einer Kundin zu einem geteilten Reel.
// Liegt bewusst getrennt vom Reel: der Inhalt gehört der Marke, die
// Bebilderung der Kundin. Sonst würde die Auswahl der einen Kundin die
// der anderen überschreiben.
export interface BRollZuordnung {
  id: string;
  userId: string;
  reelId: string;
  brollIds: string[];
  geaendertAm: string;
}

export interface WochenplanEintrag {
  id: string;
  // ISO-Kalenderwoche im Format 2026-W37
  kalenderwoche: string;
  tag: string; // "Montag" ... "Sonntag"
  uhrzeit: string; // "18:00"
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
  // Grundlage der Warnung vor heiklen Formulierungen.
  woerterVermeiden: string[];
  kernbotschaften: string[];
  standardCtas: string[];
}
