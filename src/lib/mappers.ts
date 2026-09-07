import {
  BeobachteterAccount,
  BRollClip,
  BRollZuordnung,
  MarkeninfoEintrag,
  ReelCard,
  WochenplanEintrag,
} from "./types";

// Diese Datei ist die einzige Stelle, die weiß, wie Supabase-Zeilen
// (snake_case) auf die App-Typen (camelCase) abgebildet werden.
// Ändert sich das DB-Schema, wird nur hier angepasst.

// --- Reels ---

export function dbToReel(row: Record<string, unknown>): ReelCard {
  return {
    id: row.id as string,
    marke: row.marke as ReelCard["marke"],
    zielgruppe: row.zielgruppe as ReelCard["zielgruppe"],
    ziel: row.ziel as ReelCard["ziel"],
    thema: row.thema as string,
    produkt: (row.produkt as string) ?? undefined,
    hook: row.hook as string,
    brollEmpfehlung: row.broll_empfehlung as string,
    brollIds: (row.broll_ids as string[]) ?? [],
    textOverlays: (row.text_overlays as ReelCard["textOverlays"]) ?? [],
    caption: row.caption as string,
    cta: row.cta as string,
    status: row.status as ReelCard["status"],
    contentArt: row.content_art as ReelCard["contentArt"],
    erstelltAm: row.erstellt_am as string,
    geaendertAm: (row.geaendert_am as string) ?? (row.erstellt_am as string),
    freigegebenFuerKunden: Boolean(row.freigegeben_fuer_kunden),
  };
}

export function reelToDb(reel: ReelCard) {
  return {
    id: reel.id,
    marke: reel.marke,
    zielgruppe: reel.zielgruppe,
    ziel: reel.ziel,
    thema: reel.thema,
    produkt: reel.produkt ?? null,
    hook: reel.hook,
    broll_empfehlung: reel.brollEmpfehlung,
    broll_ids: reel.brollIds,
    text_overlays: reel.textOverlays,
    caption: reel.caption,
    cta: reel.cta,
    status: reel.status,
    content_art: reel.contentArt,
    erstellt_am: reel.erstelltAm,
    geaendert_am: reel.geaendertAm,
    freigegeben_fuer_kunden: reel.freigegebenFuerKunden,
  };
}

// --- B-Roll ---

export function dbToBroll(row: Record<string, unknown>): BRollClip {
  return {
    id: row.id as string,
    titel: row.titel as string,
    beschreibung: row.beschreibung as string,
    tags: (row.tags as string[]) ?? [],
    produkt: (row.produkt as string) ?? undefined,
    kategorie: row.kategorie as string,
    besitzer: (row.besitzer as BRollClip["besitzer"]) ?? "marke",
    besitzerUserId: (row.besitzer_user_id as string) ?? undefined,
    dauerSekunden: (row.dauer_sekunden as number) ?? 8,
    vorschauFarbe: (row.vorschau_farbe as string) ?? "#eee7dd",
  };
}

export function brollToDb(clip: BRollClip) {
  return {
    id: clip.id,
    titel: clip.titel,
    beschreibung: clip.beschreibung,
    tags: clip.tags,
    produkt: clip.produkt ?? null,
    kategorie: clip.kategorie,
    besitzer: clip.besitzer,
    besitzer_user_id: clip.besitzerUserId ?? null,
    dauer_sekunden: clip.dauerSekunden,
    vorschau_farbe: clip.vorschauFarbe,
  };
}

// --- Persönliche B-Roll-Zuordnung ---

export function dbToZuordnung(row: Record<string, unknown>): BRollZuordnung {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    reelId: row.reel_id as string,
    brollIds: (row.broll_ids as string[]) ?? [],
    geaendertAm: row.geaendert_am as string,
  };
}

export function zuordnungToDb(zuordnung: BRollZuordnung) {
  return {
    id: zuordnung.id,
    user_id: zuordnung.userId,
    reel_id: zuordnung.reelId,
    broll_ids: zuordnung.brollIds,
    geaendert_am: zuordnung.geaendertAm,
  };
}

// --- Accounts ---

export function dbToAccount(row: Record<string, unknown>): BeobachteterAccount {
  return {
    id: row.id as string,
    handle: row.handle as string,
    hinzugefuegtAm: row.hinzugefuegt_am as string,
    letzteAnalyse: (row.letzte_analyse as string) ?? undefined,
  };
}

// --- Wochenplan ---

export function dbToWochenplan(row: Record<string, unknown>): WochenplanEintrag {
  return {
    id: row.id as string,
    kalenderwoche: row.kalenderwoche as string,
    uhrzeit: (row.uhrzeit as string) ?? "12:00",
    tag: row.tag as string,
    thema: row.thema as string,
    ziel: row.ziel as WochenplanEintrag["ziel"],
    status: row.status as WochenplanEintrag["status"],
    brollId: (row.broll_id as string) ?? undefined,
    reelId: (row.reel_id as string) ?? undefined,
  };
}

export function wochenplanToDb(eintrag: WochenplanEintrag) {
  return {
    id: eintrag.id,
    kalenderwoche: eintrag.kalenderwoche,
    uhrzeit: eintrag.uhrzeit,
    tag: eintrag.tag,
    thema: eintrag.thema,
    ziel: eintrag.ziel,
    status: eintrag.status,
    broll_id: eintrag.brollId ?? null,
    reel_id: eintrag.reelId ?? null,
  };
}

// --- Markenwissen ---

export function dbToMarkeninfo(row: Record<string, unknown>): MarkeninfoEintrag {
  return {
    marke: row.marke as MarkeninfoEintrag["marke"],
    zielgruppe: row.zielgruppe as string,
    tonalitaet: row.tonalitaet as string,
    produkte: (row.produkte as string[]) ?? [],
    woerterVermeiden: (row.woerter_vermeiden as string[]) ?? [],
    kernbotschaften: (row.kernbotschaften as string[]) ?? [],
    standardCtas: (row.standard_ctas as string[]) ?? [],
  };
}

export function markeninfoToDb(eintrag: MarkeninfoEintrag) {
  return {
    marke: eintrag.marke,
    zielgruppe: eintrag.zielgruppe,
    tonalitaet: eintrag.tonalitaet,
    produkte: eintrag.produkte,
    woerter_vermeiden: eintrag.woerterVermeiden,
    kernbotschaften: eintrag.kernbotschaften,
    standard_ctas: eintrag.standardCtas,
  };
}
