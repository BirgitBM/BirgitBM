// Beispieldaten für die Instagram-Analyse.
//
// Alle übrigen Daten (Reels, B-Roll, Accounts, Wochenplan, Markenwissen)
// kommen aus Supabase – die früheren Mock-Arrays sind entfernt, damit die
// Anwendung nicht versehentlich auf Beispieldaten zurückfällt.
//
// Die Research-Analyse hat noch keine Datenquelle: eine echte
// Instagram-Auswertung braucht einen kostenpflichtigen Datenzugang.

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
