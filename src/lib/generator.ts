import { BROLL_CLIPS } from "./mock/broll";
import type {
  Audience,
  BrandId,
  ContentGoal,
  ContentItem,
  TextOverlay,
} from "./types";

/**
 * Regelbasierter Platzhalter-Generator.
 *
 * Erzeugt aus Marke, Zielgruppe, Ziel und Thema eine vollständige Reel-Karte.
 * Später wird genau diese Funktion durch einen Aufruf an ein Sprachmodell
 * ersetzt – die Ein- und Ausgabe bleibt dabei gleich.
 */

export interface GeneratorEingabe {
  brandId: BrandId;
  audience: Audience;
  goal: ContentGoal;
  thema: string;
  produkt?: string;
}

/**
 * Hook-Vorlagen.
 *
 * Wichtig: `{thema}` steht in jeder Vorlage an einer Satzgrenze (Satzanfang
 * oder nach Doppelpunkt/Gedankenstrich). Nur so bleibt der Satz auch dann
 * korrekt, wenn als Thema ein ganzer Halbsatz eingegeben wird und nicht nur
 * ein Stichwort.
 */
const HOOKS_NACH_ZIEL: Record<ContentGoal, string[]> = {
  reichweite: [
    "{thema} – 3 Fehler, die ich fast täglich sehe.",
    "Kurz und unbequem: {thema}.",
    "Das sehe ich in Studios fast täglich falsch gemacht: {thema}.",
  ],
  education: [
    "{thema} – in 20 Sekunden erklärt, ohne Fachchinesisch.",
    "Einmal richtig verstanden: {thema}.",
    "Das passiert dabei wirklich in der Haut: {thema}.",
  ],
  produktverkauf: [
    "{thema} – und warum {produkt} hier den Unterschied macht.",
    "Wenn deine Kundin danach fragt, ist {produkt} die Antwort: {thema}.",
    "Ein Produkt, ein klarer Anlass: {thema}.",
  ],
  behandlung_verkaufen: [
    "So erklärst du es in 15 Sekunden – und die Kundin bucht: {thema}.",
    "{thema} – so wird daraus eine gebuchte Behandlung.",
    "Diese Behandlung buchen Kundinnen nach einem einzigen Satz: {thema}.",
  ],
  neue_studios: [
    "Warum immer mehr Studios hier umstellen: {thema}.",
    "{thema} – was Studios verlieren, die es lassen wie bisher.",
    "Ich habe 50 Studios gefragt, woran es scheitert: {thema}.",
  ],
  vertrauen: [
    "Ich sage dir ehrlich, was hier nicht funktioniert: {thema}.",
    "{thema} – und was ich dir bewusst nicht verspreche.",
    "Nach 15 Jahren im Studio sehe ich das anders: {thema}.",
  ],
  einwand: [
    "„Das ist mir zu teuer.“ Was deine Kundin wirklich meint: {thema}.",
    "{thema} – der häufigste Einwand und die ruhige Antwort darauf.",
    "Wenn deine Kundin zögert, fehlt meist eine Information: {thema}.",
  ],
};

const CTAS_NACH_ZIEL: Record<ContentGoal, string> = {
  reichweite: "Teile das Reel mit einer Kollegin, die das kennt.",
  education: "Speichere dir das für deine nächste Behandlung.",
  produktverkauf: "Schreib mir „INFO“ für das Produktdatenblatt.",
  behandlung_verkaufen: "Schreib mir „ABLAUF“ für das Behandlungsprotokoll.",
  neue_studios: "Schreib mir „PARTNER“ für die Konditionen.",
  vertrauen: "Folge für Hautwissen ohne Marketing-Sprech.",
  einwand: "Kommentiere „EINWAND“ für die Gesprächsvorlage.",
};

const CAPTION_EINSTIEG: Record<ContentGoal, string> = {
  reichweite:
    "Es sind selten die großen Dinge, die den Unterschied machen – meistens sind es Kleinigkeiten im Ablauf.",
  education:
    "Kurz erklärt, damit du es direkt in der Kabine anwenden kannst.",
  produktverkauf:
    "Produkte verkaufen sich dann, wenn die Kundin den Nutzen in einem Satz versteht.",
  behandlung_verkaufen:
    "Eine Behandlung wird gebucht, wenn das Ergebnis vorstellbar ist – nicht, wenn die Methode erklärt wird.",
  neue_studios:
    "Was Studios beim Umstieg tatsächlich bewegt, ist selten der Preis.",
  vertrauen:
    "Ehrlichkeit verkauft langfristig besser als jedes Versprechen.",
  einwand:
    "Hinter einem Einwand steckt fast immer eine offene Frage, keine Ablehnung.",
};

/** Entfernt einen abschließenden Punkt, damit keine doppelte Interpunktion entsteht. */
function ohneSchlusspunkt(text: string): string {
  return text.trim().replace(/[.!?;:]+$/, "");
}

function fuellen(vorlage: string, eingabe: GeneratorEingabe): string {
  const thema = ohneSchlusspunkt(eingabe.thema) || "dieses Thema";
  const produkt = eingabe.produkt?.trim() || "das passende Produkt";
  return vorlage.replaceAll("{thema}", thema).replaceAll("{produkt}", produkt);
}

/** Wählt eine Hook-Variante. `variante` erlaubt „Hook ändern“ ohne Neuaufbau. */
export function hookErzeugen(eingabe: GeneratorEingabe, variante = 0): string {
  const vorlagen = HOOKS_NACH_ZIEL[eingabe.goal];
  return fuellen(vorlagen[variante % vorlagen.length], eingabe);
}

export function captionErzeugen(eingabe: GeneratorEingabe, variante = 0): string {
  const thema = ohneSchlusspunkt(eingabe.thema) || "dieses Thema";
  const anrede =
    eingabe.audience === "kosmetikerinnen"
      ? "Darum geht es heute:"
      : "Kurz für dich zusammengefasst:";

  const vertiefung =
    eingabe.audience === "kosmetikerinnen"
      ? "Entscheidend ist, dass Zeitpunkt und Hautzustand zusammenpassen – sonst arbeitet auch die beste Pflege gegen die Haut."
      : "Entscheidend ist die Regelmäßigkeit. Die Haut reagiert auf Gewohnheiten, nicht auf einzelne Anwendungen.";

  const kern =
    variante % 2 === 0
      ? `${CAPTION_EINSTIEG[eingabe.goal]}\n\n${anrede} ${thema}.\n\n${vertiefung}`
      : `${anrede} ${thema}.\n\n${CAPTION_EINSTIEG[eingabe.goal]}\n\n${vertiefung}`;

  const produktzeile = eingabe.produkt
    ? `\n\n${eingabe.produkt} ist dabei der Baustein, der den Unterschied macht.`
    : "";

  const frage =
    eingabe.audience === "kosmetikerinnen"
      ? "\n\nWie handhabst du das aktuell in deinem Studio?"
      : "\n\nWorauf achtest du bei deiner Pflege am meisten?";

  return `${kern}${produktzeile}${frage}`;
}

function overlaysErzeugen(eingabe: GeneratorEingabe, hook: string): TextOverlay[] {
  const thema = ohneSchlusspunkt(eingabe.thema) || "Thema";
  return [
    { zeit: "0-2s", text: hook },
    { zeit: "2-6s", text: `Darum geht es: ${thema}` },
    {
      zeit: "6-12s",
      text:
        eingabe.audience === "kosmetikerinnen"
          ? "Was das in der Kabine bedeutet"
          : "Was das für deine Haut bedeutet",
    },
    { zeit: "12-18s", text: "Der konkrete Schritt für morgen" },
    { zeit: "18-22s", text: CTAS_NACH_ZIEL[eingabe.goal] },
  ];
}

/** Sucht passende B-Roll-Clips anhand von Produkt, Ziel und Thema. */
export function brollVorschlagen(eingabe: GeneratorEingabe): string[] {
  const suchbegriffe = [
    eingabe.produkt?.toLowerCase(),
    eingabe.goal === "produktverkauf" ? "produkt" : undefined,
    eingabe.goal === "behandlung_verkaufen" ? "kabine" : undefined,
    eingabe.goal === "education" ? "detail" : undefined,
    eingabe.goal === "vertrauen" ? "beratung" : undefined,
  ].filter(Boolean) as string[];

  const treffer = BROLL_CLIPS.filter((clip) => {
    if (clip.brandId !== eingabe.brandId && clip.brandId !== "sqt-b2b") return false;
    return suchbegriffe.some(
      (begriff) =>
        clip.produkt?.toLowerCase() === begriff ||
        clip.tags.includes(begriff) ||
        clip.kategorie.toLowerCase().includes(begriff),
    );
  });

  const auswahl = (treffer.length > 0 ? treffer : BROLL_CLIPS.slice(0, 2)).slice(0, 2);
  return auswahl.map((clip) => clip.id);
}

export function reelErzeugen(
  eingabe: GeneratorEingabe,
  benutzerId: string,
): ContentItem {
  const hook = hookErzeugen(eingabe, 0);
  const brollIds = brollVorschlagen(eingabe);
  const codes = BROLL_CLIPS.filter((clip) => brollIds.includes(clip.id))
    .map((clip) => clip.code)
    .join(" und ");
  const jetzt = new Date().toISOString();

  return {
    id: `content-${Date.now().toString(36)}`,
    brandId: eingabe.brandId,
    format: "reel",
    audience: eingabe.audience,
    goal: eingabe.goal,
    thema: eingabe.thema.trim(),
    produkt: eingabe.produkt?.trim() || undefined,
    hook,
    brollIds,
    brollHinweis: codes
      ? `${codes} kombinieren: ruhiger Einstieg, danach Detailaufnahme zum Kernpunkt.`
      : "Noch kein passender Clip in der Bibliothek – neu aufnehmen.",
    overlays: overlaysErzeugen(eingabe, hook),
    caption: captionErzeugen(eingabe, 0),
    cta: CTAS_NACH_ZIEL[eingabe.goal],
    status: "entwurf",
    visibility: "intern",
    createdAt: jetzt,
    updatedAt: jetzt,
    createdBy: benutzerId,
  };
}

/** Themenvorschläge aus einer Research-Analyse („10 Ideen für SQT“). */
export function ideenErzeugen(handle: string): string[] {
  const quelle = handle.replace(/^@/, "");
  return [
    "Hautbarriere vor Wirkstoff – warum die Reihenfolge über das Ergebnis entscheidet",
    "3 Anwendungsfehler bei Ampullen, die ich in Studios sehe",
    "Was eine Behandlung wirklich kostet – Zeit, Material, Marge",
    "Homecare nach der Kabine: der Satz, der die Empfehlung trägt",
    "Sensible Haut im Herbst: was sich im Protokoll ändert",
    "Welches SQT-Set für welchen Hautzustand – Entscheidungshilfe",
    "„Das ist mir zu teuer“ – ruhig und fachlich beantworten",
    "Behandlungsablauf in 20 Sekunden für Instagram erklärt",
    "Für Ärzte und Heilpraktiker: Abgrenzung Kosmetik und Medizin",
    `Reaktion auf ein Thema von ${quelle}, aber aus B2B-Sicht gedacht`,
  ];
}
