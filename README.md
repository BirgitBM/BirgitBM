# ContentOS

Internes Content-Dashboard für die Kosmetikmarke SQT.
Version 1 arbeitet vollständig mit Beispieldaten – ohne externe Dienste, ohne
kostenpflichtige Schnittstellen, ohne automatisches Instagram-Posting.

## 1. App starten

Einmalig, nach dem Herunterladen des Projekts:

```bash
npm install
```

Danach jedes Mal:

```bash
npm run dev
```

Anschließend im Browser öffnen: **http://localhost:3000**

Beenden mit `Strg + C` im Terminal.

Weitere Befehle:

| Befehl | Bedeutung |
| --- | --- |
| `npm run dev` | Startet die App zum Arbeiten und Testen |
| `npm run build` | Erstellt die Version für den Livebetrieb |
| `npm run start` | Startet die fertige Version lokal |
| `npm run typecheck` | Prüft den Code auf Fehler |

## 2. Aufbau des Projekts

```
src/
  app/                     Die einzelnen Seiten (jede Seite = ein Ordner)
    page.tsx               Dashboard / Startseite
    research/              Instagram-Analyse
    accounts/              Beobachtete Accounts + Wochenreport
    erstellen/             Content erstellen (Reel-Karte)
    broll/                 B-Roll-Bibliothek
    wochenplan/            Wochenansicht mit 5 Reels
    bibliothek/            Content-Bibliothek mit Filtern
    markenwissen/          Markeninformationen
    layout.tsx             Rahmen um alle Seiten
    globals.css            Farben und Grundgestaltung

  components/              Wiederverwendbare Bausteine
    app-shell.tsx          Navigation links, Marken- und Rollenauswahl
    reel-card.tsx          Die Reel-Karte
    ui.tsx                 Buttons, Karten, Felder, Status-Kennzeichen
    icons.tsx              Symbole

  lib/
    types.ts               Alle Datenfelder an einem Ort
    auth.ts                Rollen (Admin, Studio-Kunde, Premium-Kunde)
    generator.ts           Erzeugt Hook, Caption, Overlays, CTA
    labels.ts              Deutsche Bezeichnungen und Formatierungen
    store.tsx              Hält die Daten während der Nutzung
    week.ts                Kalenderwochen- und Datumsberechnung
    data/                  Datenzugriff (später Supabase)
    mock/                  Beispieldaten (Marken, B-Roll, Inhalte, Research)
```

**Die drei Dateien, die du am ehesten ändern lassen willst:**

- `src/lib/mock/knowledge.ts` – Markenwissen und Produkte
- `src/lib/mock/broll.ts` – B-Roll-Clips
- `src/lib/generator.ts` – Formulierungen für Hooks, Captions und CTAs

## 3. Änderungen später beauftragen

Am schnellsten geht es, wenn du drei Dinge nennst:

1. **Wo:** der Bereich, z. B. „Wochenplan" oder „Content erstellen"
2. **Was:** was heute passiert und was stattdessen passieren soll
3. **Warum:** wofür du das brauchst – daraus ergibt sich oft die bessere Lösung

Beispiel: *„Im Wochenplan möchte ich auch Samstag und Sonntag planen können,
weil ich sonntags abends die besten Reichweiten habe."*

Änderungen laufen immer über einen eigenen Branch, damit die laufende Version
nicht kaputt geht.

## 4. Veröffentlichung bei Vercel

Die App ist ein Standard-Next.js-Projekt und läuft bei Vercel ohne
Zusatzarbeit:

1. Konto auf [vercel.com](https://vercel.com) anlegen und mit GitHub verbinden
2. „Add New… → Project" wählen und dieses Repository auswählen
3. Vercel erkennt Next.js automatisch – keine Einstellungen nötig
4. Auf „Deploy" klicken; nach etwa zwei Minuten ist die App online
5. Später eigene Domain unter „Settings → Domains" hinterlegen

Kosten: Für internes Testen reicht der kostenlose Hobby-Tarif. Sobald Kundinnen
Zugang bekommen, ist der Pro-Tarif nötig (Stand heute rund 20 $ pro Monat und
Nutzer). Das besprechen wir vorher.

## Texte selbst ändern

Jede Reel-Karte ist direkt bearbeitbar – in „Content erstellen" und in der
Content-Bibliothek. Anklicken, tippen, fertig. Änderbar sind:

- Thema (die Überschrift der Karte)
- Hook
- B-Roll-Hinweis
- Textoverlay: Zeitangabe und Text je Zeile, Zeilen hinzufügen und entfernen
- Caption
- Call-to-Action

Solange etwas offen ist, steht rechts unten „Nicht gespeicherte Änderungen".
Erst „Speichern" schreibt den Stand fest.

Die Knöpfe „Anderer Hook" und „Andere Caption" holen weiterhin einen
Formulierungsvorschlag. Achtung: Sie **überschreiben** deinen getippten Text.

Für Kundenrollen ist die Karte reine Anzeige – dort lässt sich nichts ändern.

## B-Roll verwalten und zuordnen

In der B-Roll-Bibliothek legst du Clips selbst an, änderst und löschst sie.
Die Kennung (B001, B002 …) wird automatisch fortgezählt.

Auf jeder Reel-Karte lassen sich Clips einzeln zuordnen und wieder entfernen.

**Wichtig für das spätere Abo-Modell:** Ein Inhalt gehört dir und wird von
allen Kundinnen geteilt. Welche Clips eine Kundin dafür verwendet, ist ihre
eigene Zuordnung – sie wird getrennt gespeichert und verändert dein Original
nicht. Zum Ausprobieren: links unten die Rolle auf „Studio-Kunde" stellen,
Clips tauschen, zurück auf „Admin" wechseln. Dein Stand bleibt unverändert.

Das Hochladen echter Videodateien braucht Datenbank und Datei-Speicher und
kommt mit dem Supabase-Schritt.

## Weitere Funktionen

- **Duplizieren** – dasselbe Thema für die andere Zielgruppe variieren
- **Löschen** – mit Sicherheitsabfrage
- **Alles kopieren** – Hook, B-Roll, Overlays, Caption und CTA als Text in die
  Zwischenablage, zur Weitergabe an die Person, die das Reel produziert
- **Status direkt auf der Karte** ändern
- **Warnung bei heiklen Formulierungen** – Wörter aus der Verbotsliste im
  Markenwissen werden über der Karte angezeigt. Das ist ein einfacher
  Wortabgleich und ersetzt keine rechtliche Prüfung.
- **Wochenplan über mehrere Wochen** – vor- und zurückblättern, einzelne
  Beiträge anlegen, auf andere Tage verschieben und entfernen

## Wichtig zu wissen

- **Alle Daten sind Beispieldaten.** Es besteht keine Verbindung zu Instagram.
- **Änderungen bleiben nur im Browser** (lokaler Speicher). Ein anderer Rechner
  oder Browser sieht sie nicht. Das ändert sich mit der Supabase-Anbindung.
- **Kein automatisches Posten.** Bewusst nicht Teil dieser Version.
- **Kein Supabase, keine Datenbank, keine Migrationen.** Das Projekt hat keine
  externen Dienste. Nach einem Update ist also nie eine Migration auszuführen –
  es genügt `npm install` und `npm run dev`.
- **Nach einem Update werden die Beispieldaten im Browser neu geladen**, sobald
  sich das Datenmodell geändert hat. Eigene Testeingaben aus der vorherigen
  Fassung gehen dabei verloren. Das ist gewollt: halb passende Altdaten
  verursachen sonst Fehler, die schwer zu finden sind.

## Nächste Ausbaustufe

Siehe [`docs/supabase.md`](docs/supabase.md) – dort steht, wie Datenbank,
Benutzerkonten und Kundenzugänge angeschlossen werden.
