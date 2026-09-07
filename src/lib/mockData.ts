import {
  BRollClip,
  BeobachteterAccount,
  MarkeninfoEintrag,
  ReelCard,
  WochenplanEintrag,
} from "./types";

export const brollBibliothek: BRollClip[] = [
  {
    id: "B001",
    titel: "Radiance Set auf Behandlungstisch",
    beschreibung: "Produktset drapiert auf weißem Behandlungstuch, Studiolicht.",
    tags: ["Produkt", "Studio", "clean"],
    produkt: "Radiance",
    kategorie: "Produktaufnahme",
  },
  {
    id: "B002",
    titel: "Refine Verpackung öffnen",
    beschreibung: "Hände öffnen die Verpackung, langsame Bewegung, Nahaufnahme.",
    tags: ["Unboxing", "Hände", "Nahaufnahme"],
    produkt: "Refine",
    kategorie: "Produktaufnahme",
  },
  {
    id: "B003",
    titel: "Ampulle in der Hand",
    beschreibung: "Ampulle wird zwischen zwei Fingern gehalten, Gegenlicht.",
    tags: ["Ampulle", "Makro", "Gegenlicht"],
    kategorie: "Produktaufnahme",
  },
  {
    id: "B004",
    titel: "Behandlungsvorbereitung",
    beschreibung: "Kosmetikerin bereitet den Arbeitsplatz für eine Behandlung vor.",
    tags: ["Behandlung", "Studio", "Prozess"],
    kategorie: "Behandlungsablauf",
  },
  {
    id: "B005",
    titel: "Produktregal",
    beschreibung: "Schwenk über ein geordnetes Regal mit der gesamten Produktlinie.",
    tags: ["Regal", "Übersicht", "Studio"],
    kategorie: "Produktaufnahme",
  },
];

export const beobachteteAccounts: BeobachteterAccount[] = [
  { id: "A001", handle: "@dermaklinik_berlin", hinzugefuegtAm: "2026-08-12", letzteAnalyse: "2026-09-01" },
  { id: "A002", handle: "@hautzentrum.muc", hinzugefuegtAm: "2026-08-18", letzteAnalyse: "2026-08-30" },
  { id: "A003", handle: "@beauty.insights.de", hinzugefuegtAm: "2026-08-25" },
];

export const reelBibliothek: ReelCard[] = [
  {
    id: "R001",
    marke: "SQT B2B",
    zielgruppe: "Kosmetikerinnen",
    ziel: "Education",
    thema: "Warum Spiculae anders wirken als klassische Microneedling-Nadeln",
    produkt: "SQT Biomicroneedling Starter-Set",
    hook: "Die meisten Kosmetikerinnen erklären Microneedling falsch – hier ist der Unterschied.",
    brollEmpfehlung: "B003 – Ampulle in der Hand",
    textOverlays: [
      { zeit: "0:00–0:03", text: "Microneedling ≠ Microneedling" },
      { zeit: "0:03–0:08", text: "Spiculae lösen sich im Gewebe auf" },
      { zeit: "0:08–0:15", text: "Das bedeutet für deine Behandlung..." },
    ],
    caption:
      "Spiculae sind keine Nadeln im klassischen Sinn – sie lösen sich im Gewebe auf und setzen den Regenerationsprozess anders in Gang. Genau das macht den Unterschied für messbare Ergebnisse in deiner Behandlung.",
    cta: "Mehr zum Protokoll im Profil",
    status: "Freigegeben",
    contentArt: "Reel",
    erstelltAm: "2026-09-01",
    freigegebenFuerKunden: false,
  },
  {
    id: "R002",
    marke: "SQT Homecare",
    zielgruppe: "Endkunden",
    ziel: "Produktverkauf",
    thema: "Radiance Serum Anwendung zuhause",
    produkt: "Radiance",
    hook: "Das Studio-Ergebnis auch zwischen den Behandlungen halten.",
    brollEmpfehlung: "B001 – Radiance Set auf Behandlungstisch",
    textOverlays: [
      { zeit: "0:00–0:04", text: "Zwischen den Behandlungen passiert oft: nichts." },
      { zeit: "0:04–0:10", text: "Radiance hält den Effekt aufrecht" },
    ],
    caption:
      "Deine Haut regeneriert sich nicht nur im Studio. Radiance ist die Ergänzung für zuhause, abgestimmt auf deine Behandlung.",
    cta: "Jetzt im Shop entdecken",
    status: "Entwurf",
    contentArt: "Reel",
    erstelltAm: "2026-09-02",
    freigegebenFuerKunden: false,
  },
  {
    id: "R003",
    marke: "Exoprime",
    zielgruppe: "Kosmetikerinnen",
    ziel: "Vertrauen",
    thema: "Warum wir Exoprime exklusiv aus Italien beziehen",
    hook: "Nicht jedes Exosomen-Produkt hält, was es verspricht.",
    brollEmpfehlung: "B005 – Produktregal",
    textOverlays: [
      { zeit: "0:00–0:03", text: "Exosomen sind aktuell überall." },
      { zeit: "0:03–0:09", text: "Herkunft und Herstellung entscheiden über Qualität." },
    ],
    caption:
      "Exoprime wird in Italien nach klar definierten Standards hergestellt. Als exklusive deutsche Vertriebspartnerin achten wir genau darauf, was in deiner Praxis ankommt.",
    cta: "Fragen? Schreib uns.",
    status: "Idee",
    contentArt: "Reel",
    erstelltAm: "2026-09-03",
    freigegebenFuerKunden: false,
  },
];

export const wochenplan: WochenplanEintrag[] = [
  { id: "W001", tag: "Montag", thema: "Spiculae vs. klassisches Microneedling", ziel: "Education", status: "Freigegeben", brollId: "B003", reelId: "R001" },
  { id: "W002", tag: "Dienstag", thema: "Radiance Set im Detail", ziel: "Produktverkauf", status: "Entwurf", brollId: "B001", reelId: "R002" },
  { id: "W003", tag: "Mittwoch", thema: "Ein Tag im Behandlungsraum", ziel: "Reichweite", status: "Idee", brollId: "B004" },
  { id: "W004", tag: "Donnerstag", thema: "Herkunft von Exoprime", ziel: "Vertrauen", status: "Idee", brollId: "B005", reelId: "R003" },
  { id: "W005", tag: "Freitag", thema: "Refine Unboxing", ziel: "Education", status: "Idee", brollId: "B002" },
];

export const markenwissen: MarkeninfoEintrag[] = [
  {
    marke: "SQT B2B",
    zielgruppe: "Kosmetikerinnen, Heilpraktiker und Ärzte",
    tonalitaet: "professionell, verständlich, modern, nicht übertrieben",
    produkte: ["Nourishing", "Revitalizing", "Anti-Aging", "Recovery", "Body", "Radiance", "Refine"],
  },
];

export const instagramAnalyseMock = (account: string) => ({
  account,
  erfolgreichsteThemen: [
    "Vorher/Nachher-Ergebnisse mit Erklärung",
    "Behandlungsmythen aufklären",
    "Hinter den Kulissen im Studio",
  ],
  haeufigsteHooks: [
    "\"Das erklärt dir niemand über...\"",
    "\"3 Fehler, die ich bei X sehe\"",
    "Direkte Frage an die Zielgruppe",
  ],
  erfolgreichsteReels: [
    { titel: "Mythos: Mehr Nadeln = besseres Ergebnis", kennzahl: "142.000 Aufrufe" },
    { titel: "So bereite ich die Haut wirklich vor", kennzahl: "98.500 Aufrufe" },
    { titel: "Warum ich dieses Produkt nicht mehr nutze", kennzahl: "76.200 Aufrufe" },
  ],
  postingFrequenz: "4–5 Beiträge pro Woche, Schwerpunkt Dienstag/Donnerstag",
  verwendeteCtas: ["Termin über Link in Bio", "Frag uns in den Kommentaren", "Speichern für später"],
  wiederkehrendeFormate: ["Talking-Head-Erklärung", "Behandlung mit Voiceover", "Vorher/Nachher-Split"],
  contentChancenFuerSqt: [
    "Erklärvideos zum Wirkmechanismus von Spiculae fehlen bei Wettbewerbern",
    "Kaum jemand zeigt die Herkunft/Herstellung der Produkte",
    "Einwandbehandlung zu Preis wird nirgends offen adressiert",
  ],
  contentLuecken: [
    "Keine Inhalte für Heilpraktiker als eigene Zielgruppe",
    "Wenig Content zur Kombination mehrerer Behandlungen",
  ],
});
