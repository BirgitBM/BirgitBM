import type { ResearchResult, WatchedAccount, WochenReport } from "../types";

export const BEOBACHTETE_ACCOUNTS: WatchedAccount[] = [
  {
    id: "acc-001",
    handle: "@skinlab.academy",
    beschreibung: "Fortbildungen für Kosmetikerinnen, sehr aktiv mit Education-Reels.",
    kategorie: "Ausbildung",
    follower: 48200,
    hinzugefuegtAm: "2026-06-14T10:00:00.000Z",
    letzteAnalyse: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "acc-002",
    handle: "@derma.studio.mn",
    beschreibung: "Studio mit starkem Fokus auf Behandlungsvorher-nachher.",
    kategorie: "Studio",
    follower: 21500,
    hinzugefuegtAm: "2026-06-20T10:00:00.000Z",
    letzteAnalyse: "2026-08-30T09:00:00.000Z",
  },
  {
    id: "acc-003",
    handle: "@wirkstoff.wissen",
    beschreibung: "Erklärt Inhaltsstoffe für Endkunden, hohe Speicherrate.",
    kategorie: "Education",
    follower: 96400,
    hinzugefuegtAm: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "acc-004",
    handle: "@beautybusiness.de",
    beschreibung: "Business-Themen für Studioinhaberinnen: Preise, Personal, Verkauf.",
    kategorie: "Business",
    follower: 33100,
    hinzugefuegtAm: "2026-07-18T10:00:00.000Z",
    letzteAnalyse: "2026-08-28T09:00:00.000Z",
  },
];

/**
 * Beispielhaftes Analyseergebnis. Wird aktuell aus dem Handle deterministisch
 * abgeleitet, damit die Oberfläche realistisch wirkt – ohne externe API.
 */
export function mockAnalyse(handle: string): ResearchResult {
  const bereinigt = handle.trim().replace(/^@/, "") || "beispiel.account";
  const streuung = bereinigt.length % 5;

  return {
    handle: `@${bereinigt}`,
    analysiertAm: new Date().toISOString(),
    follower: 18400 + streuung * 7300,
    postingFrequenz: `${4 + (streuung % 3)} Beiträge pro Woche, Schwerpunkt Di/Do/So abends`,
    durchschnittlicheAufrufe: 11200 + streuung * 2400,
    topThemen: [
      { thema: "Hautbarriere & sensible Haut", reichweite: 38400, anteilProzent: 28 },
      { thema: "Behandlungsablauf zeigen", reichweite: 26100, anteilProzent: 22 },
      { thema: "Wirkstoffe einfach erklärt", reichweite: 21800, anteilProzent: 19 },
      { thema: "Fehler in der Anwendung", reichweite: 17300, anteilProzent: 16 },
      { thema: "Studio-Alltag & Team", reichweite: 9400, anteilProzent: 15 },
    ],
    haeufigeHooks: [
      "3 Fehler, die ich fast täglich sehe",
      "Das hättest du mir vor 5 Jahren sagen sollen",
      "Wenn deine Kundin das sagt, meint sie eigentlich …",
      "Nein, das ist kein Hautproblem – das ist ein Pflegefehler",
      "Ich habe 200 Behandlungen ausgewertet. Das kam heraus:",
      "Bitte hör auf, das deinen Kundinnen zu empfehlen",
    ],
    topReels: [
      {
        titel: "Warum deine Kundin nach der Behandlung rot bleibt",
        hook: "Nein, das ist keine Unverträglichkeit.",
        aufrufe: 184000,
        likes: 6120,
        kommentare: 341,
        format: "Talking Head + B-Roll",
      },
      {
        titel: "Der Ampullen-Fehler Nr. 1",
        hook: "3 Fehler, die ich fast täglich sehe",
        aufrufe: 121400,
        likes: 4380,
        kommentare: 208,
        format: "Schnellschnitt Detailaufnahmen",
      },
      {
        titel: "So baust du eine Kur richtig auf",
        hook: "Eine Kur ohne Plan ist verschenktes Geld.",
        aufrufe: 96700,
        likes: 3910,
        kommentare: 176,
        format: "Text-Overlay-Reel",
      },
      {
        titel: "Was ich meiner Kundin nie mehr sage",
        hook: "Diesen Satz habe ich aus meiner Beratung gestrichen.",
        aufrufe: 74200,
        likes: 2840,
        kommentare: 265,
        format: "Story-Telling",
      },
    ],
    ctas: [
      "Kommentiere „PLAN“ und ich schicke dir das Protokoll",
      "Speichere dir das für deine nächste Behandlung",
      "Teile das mit deinem Team",
      "Folge für mehr Hautwissen ohne Marketing-Sprech",
      "Link in Bio für die Fortbildung",
    ],
    formate: [
      "Talking Head mit B-Roll-Einblendungen",
      "Text-Overlay-Reel ohne Ton-Abhängigkeit",
      "Vorher/Nachher mit Ablauf-Erklärung",
      "Listen-Reel (3 Fehler / 5 Tipps)",
      "Carousel als Nachbereitung zum Reel",
    ],
    chancenFuerSqt: [
      "Wirkstoffwissen aus B2B-Sicht: derselbe Inhalt, aber für Kosmetikerinnen statt Endkunden gedacht.",
      "Behandlungsprotokolle als wiederkehrende Serie – bisher zeigt kaum jemand den vollständigen Ablauf.",
      "Einwandbehandlung im Verkaufsgespräch: hohe Relevanz, sehr wenig Angebot.",
      "Produktkombinationen erklären (welches Set für welchen Hautzustand).",
    ],
    contentLuecken: [
      "Keine Inhalte zur Wirtschaftlichkeit einer Behandlung (Preis, Zeit, Marge).",
      "Homecare-Anbindung nach der Behandlung wird nicht erklärt.",
      "Kaum Inhalte für Ärzte und Heilpraktiker, obwohl die Zielgruppe mitliest.",
      "Keine Serie zu Hautzuständen im Jahresverlauf.",
    ],
  };
}

export const WOCHEN_REPORT: WochenReport = {
  erstelltAm: "2026-09-06T08:00:00.000Z",
  analysierteAccounts: 4,
  trends: [
    "Listen-Reels („3 Fehler …“) laufen aktuell deutlich besser als Vorher/Nachher.",
    "Text-Overlay ohne Sprache gewinnt an Reichweite – viele schauen ohne Ton.",
    "Kommentar-CTAs mit einzelnem Schlüsselwort erzeugen die meisten Interaktionen.",
    "Business-Themen für Studioinhaberinnen wachsen schneller als reine Produktthemen.",
  ],
  erfolgreicheThemen: [
    "Hautbarriere und sensible Haut",
    "Anwendungsfehler im Studio",
    "Wirkstoffe verständlich erklärt",
    "Verkaufsgespräch in der Kabine",
  ],
  contentLuecken: [
    "Wirtschaftlichkeit von Behandlungen",
    "Homecare-Anbindung nach der Kabine",
    "Inhalte speziell für Ärzte und Heilpraktiker",
    "Saisonale Hautzustände",
  ],
  empfehlung:
    "Diese Woche zwei Listen-Reels zu Anwendungsfehlern einplanen und ein Reel zur Wirtschaftlichkeit testen – dort ist die Lücke am größten.",
};
