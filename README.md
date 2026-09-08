# ContentOS — Version 1 (Supabase-Anbindung)

Internes Content-Dashboard für SQT: Instagram-Research, Content-Erstellung,
B-Roll-Verwaltung, Wochenplanung und Content-Bibliothek in einer Oberfläche.
Die Daten liegen jetzt in Supabase statt im Browser-Speicher.

## 1. Wie du die App startest

```bash
cd contentos
npm install
```

Einmalig: Im Supabase-Dashboard deines Projekts → „SQL Editor" → Inhalt von
`supabase/schema.sql` einfügen und ausführen. Das legt alle Tabellen an und
befüllt sie mit denselben Beispieldaten, die du schon kennst.

Die Datei `.env.local` ist bereits mit deinen Zugangsdaten befüllt (liegt
nicht im Git-Repository, siehe `.gitignore`). Danach:

```bash
npm run dev
```

Im Browser öffnen: http://localhost:3000

## 2. Wo die wichtigsten Dateien liegen

```
src/app/                    → eine Seite pro Ordner (Next.js App Router)
src/lib/
  types.ts                    Alle Datenmodelle
  supabaseClient.ts            Supabase-Verbindung
  mappers.ts                   Übersetzt zwischen Supabase-Spalten und App-Typen
  store.tsx                    Lädt/speichert Daten in Supabase, State für die App
  mockData.ts                  Nur noch als Referenz/Backup, wird nicht mehr geladen
src/components/
  Sidebar.tsx, MobileNav.tsx     Navigation
  ui.tsx                         Wiederverwendbare Bausteine
  AuthGate.tsx                   Login-Absicherung (siehe Punkt 3)
  StoreStatusBanner.tsx          Zeigt Lade-/Fehlerzustand von Supabase an
supabase/
  schema.sql                    Phase 1: Tabellen + offene Policies + Seed-Daten
  schema_auth.sql                Phase 2: restriktive Policies (vor Deployment)
```

## 3. Sicherheitsmodell — zwei Phasen

**Phase 1 (jetzt, lokale Entwicklung):** `NEXT_PUBLIC_REQUIRE_AUTH=false` in
`.env.local`. Kein Login nötig. Die Supabase-Tabellen erlauben dem
öffentlichen (anon) Key vollen Zugriff — das ist für lokales Testen in
Ordnung, aber nicht für ein öffentliches Deployment.

**Phase 2 (bevor wir auf Vercel deployen):**

1. In Supabase → Authentication → Users → einen Admin-Nutzer per
   E-Mail/Passwort anlegen.
2. `supabase/schema_auth.sql` im SQL Editor ausführen. Das ersetzt die
   offenen Policies durch Policies, die nur eingeloggten Nutzern Zugriff
   geben — der anon-Key kann danach nichts mehr lesen oder schreiben.
3. In `.env.local` (lokal) bzw. in den Vercel-Umgebungsvariablen
   (Produktion) `NEXT_PUBLIC_REQUIRE_AUTH=true` setzen.
4. Ab dann zeigt die App vor jedem Zugriff einen Login-Bildschirm
   (E-Mail/Passwort). Die Login-Logik ist bereits fertig gebaut
   (`src/components/AuthGate.tsx`) — dieser Schritt schaltet sie nur scharf.

Diese Reihenfolge ist wichtig: Schritt 2 vor Schritt 3, sonst sperrst du
dich selbst aus, bevor ein Admin-Nutzer existiert.

Noch nicht gebaut, weil noch nicht gebraucht: unterschiedliche Rechte für
Studio-/Premium-Kunden (nur „eingeloggt ja/nein" wird unterschieden). Die
Datenfelder dafür (`UserRole`, `freigegebenFuerKunden`) sind vorbereitet,
siehe Hinweis am Ende von `supabase/schema_auth.sql`.

## 3b. Datenbank aktualisieren (Migration 002)

Nach diesem Update **einmalig** im Supabase-Dashboard unter „SQL Editor"
ausführen:

```
supabase/migration_002_broll_und_planung.sql
```

Die Migration ist mehrfach ausführbar und verändert keine vorhandenen Daten.
Sie ergänzt:

| Tabelle | Neu |
| --- | --- |
| `broll` | `besitzer` (marke/kunde), `besitzer_user_id`, `dauer_sekunden`, `vorschau_farbe` |
| `reels` | `broll_ids` (mehrere Clips statt einer Textempfehlung), `geaendert_am` |
| `broll_zuordnungen` | **neue Tabelle** – persönliche Clip-Auswahl je Kundin |
| `wochenplan` | `kalenderwoche`, `uhrzeit` |
| `markenwissen` | `woerter_vermeiden`, `kernbotschaften`, `standard_ctas` |

Bestehende Reels behalten ihre Clip-Zuordnung: Die Migration liest die Kennung
aus dem Empfehlungstext („B003 – Ampulle in der Hand" wird zu `{B003}`).
Bestehende Wochenplan-Einträge werden der laufenden Kalenderwoche zugeordnet.

Läuft bereits `schema_auth.sql` (Login erforderlich), zusätzlich ausführen:

```
supabase/migration_002_broll_und_planung_auth.sql
```

### Warum B-Roll eine eigene Tabelle braucht

Das Abo-Modell lautet: **der Inhalt gehört der Marke, die Bilder gehören der
Kundin.** Mehrere Kundinnen verwenden dasselbe Reel-Skript, aber jede mit
ihren eigenen Clips. Läge die Clip-Auswahl im Reel selbst, würde die Auswahl
einer Kundin die einer anderen überschreiben. Deshalb liegt sie getrennt in
`broll_zuordnungen`.

Zum Ausprobieren: links unten in der Navigation die Rolle auf „Studio-Kunde"
stellen, Clips tauschen, zurück auf „Admin" wechseln – das Original bleibt
unverändert.

## 3d. Video zu einem B-Roll-Clip (Migration 003)

Ebenfalls einmalig im SQL Editor ausführen:

```
supabase/migration_003_video.sql
```

Danach hat jeder Clip ein Feld **Video-Link**. Die Datei bleibt bei deinem
Cloud-Dienst (Google Drive, Dropbox, WeTransfer, Vimeo …), im Dashboard steht
nur die Adresse. Ist ein Link hinterlegt, erscheint auf der Clip-Vorschau
„Video öffnen", in der Reel-Karte ein kleiner Link neben dem Clip, und
„Alles kopieren" nimmt die Adresse mit auf — so kommt die Person, die das
Reel schneidet, direkt an die Datei.

**Wichtig:** Der Link muss für die Personen freigegeben sein, die ihn öffnen
sollen. Die Rechte liegen bei deinem Cloud-Dienst, nicht bei ContentOS.

Erlaubt sind nur Adressen mit `http://` oder `https://`. Geprüft wird an zwei
Stellen: im Formular und über eine Regel in der Datenbank. Grund: Ein
gespeicherter Link wird als anklickbare Adresse ausgegeben — ohne Prüfung
liesse sich dort Schadcode hinterlegen.

### Echtes Hochladen kommt später

Die Spalten `video_pfad`, `dateigroesse_bytes` und `video_quelle` sind bereits
angelegt, damit für den späteren Upload nach Supabase Storage **keine weitere
Migration** nötig ist. Gebaut ist er noch nicht — vorher sollten die
Speicher- und Datenverkehrskosten geklärt sein, denn das ist der erste Posten,
der mit der Zahl der Abo-Kundinnen mitwächst.

## 3e. Video erstellen (Migration 004 + zwei Buckets + FFmpeg)

Aus einem Reel wird eine fertige MP4: 9:16, höchstens 30 Sekunden, Texte
exakt in ihren Zeitfenstern, B-Roll-Clips hintereinander an den
Textabschnitten ausgerichtet.

**Gerendert wird auf deinem eigenen Rechner.** Vercel kann das nicht: Dort
läuft kein FFmpeg und die Laufzeit einer Funktion ist begrenzt. Das Dashboard
darf online liegen — zum Rendern startest du ContentOS lokal.

### Einmalig einrichten

**1. SQL-Migration** im Supabase-Dashboard unter „SQL Editor":

```
supabase/migration_004_render.sql
```

Läuft bereits `schema_auth.sql`, zusätzlich `migration_004_render_auth.sql`.

**2. Zwei Buckets** im Supabase-Dashboard unter „Storage" → „New bucket",
beide **privat** (Schalter „Public bucket" ausgeschaltet lassen):

| Name | Inhalt |
| --- | --- |
| `broll-videos` | die hochgeladenen Rohclips |
| `reels-fertig` | die gerenderten MP4-Dateien |

Privat heisst: Die Dateien sind nur über zeitlich begrenzte Adressen
erreichbar, die ContentOS bei Bedarf erzeugt.

**3. FFmpeg installieren** — ohne geht das Rendern nicht:

| System | Befehl |
| --- | --- |
| macOS | `brew install ffmpeg` |
| Windows | `winget install Gyan.FFmpeg` |
| Linux | `sudo apt install ffmpeg` |

Prüfen mit `ffmpeg -version`. Danach ContentOS neu starten.

### So renderst du dein erstes Reel

```bash
npm run dev
```

1. **B-Roll-Bibliothek** → Clip anlegen oder bearbeiten → im Kasten
   „Videodatei" eine MP4 oder MOV auswählen (bis 200 MB). Das für jeden Clip
   wiederholen, den du verwenden willst.
2. **Content-Bibliothek** → Reel anklicken → prüfen, dass unter „B-Roll"
   mindestens ein Clip zugeordnet ist und dass die Textoverlays Zeitfenster
   haben (z. B. „0:00–0:04").
3. **„Video erstellen"** klicken. Für 20 Sekunden dauert das etwa 5 bis 15
   Sekunden.
4. Die **Vorschau** erscheint direkt darunter. Danach **„MP4 herunterladen"**.

### Wichtig

- **Cloud-Links reichen nicht.** Google Drive, Dropbox und Vimeo liefern dem
  Server keine Videodatei, sondern eine Webseite. Gerendert wird nur mit
  hochgeladenen Dateien. Das Linkfeld bleibt als Notiz erhalten.
- **Höchstens 30 Sekunden.** Overlays, die darüber hinausgehen, werden
  gekürzt; solche, die komplett dahinter liegen, übersprungen — beides wird
  nach dem Rendern gemeldet.
- **Die Länge kommt aus den Zeitfenstern**, nicht aus der Länge der Clips.
  Ein zu kurzer Clip wird wiederholt statt schwarz zu werden.
- **Kein geheimer Schlüssel im Browser.** Das Rendern läuft in einer
  Server-Route. Optional kannst du in `.env.local` einen
  `SUPABASE_SERVICE_ROLE_KEY` hinterlegen; der Name beginnt bewusst nicht mit
  `NEXT_PUBLIC_`, damit Next.js ihn nicht ausliefert. Nötig ist er erst,
  sobald ein Login aktiv ist.

## 3c. Was seit dem Update neu ist

- **Alle Texte der Reel-Karte sind direkt bearbeitbar** – Thema, Hook,
  B-Roll-Hinweis, Textoverlay (Zeit und Text je Zeile, Zeilen hinzufügen und
  entfernen), Caption und CTA. Jede Änderung geht sofort nach Supabase.
- **B-Roll verwalten** – Clips anlegen, bearbeiten, löschen; Kennung wird
  fortgezählt; eigene Clips von Kundinnen sind gekennzeichnet.
- **Clips je Reel zuordnen** – mehrere Clips pro Reel, einzeln entfernbar.
- **Duplizieren, Löschen, „Alles kopieren"** in der Content-Bibliothek.
- **Filter** zusätzlich nach Produkt und Content-Art.
- **Wochenplan über mehrere Wochen** – vor- und zurückblättern, einzelne
  Beiträge anlegen, auf andere Tage verschieben und entfernen.
- **Warnung bei heiklen Formulierungen** – Wörter aus `woerter_vermeiden`
  werden in jeder Reel-Karte geprüft. Einfacher Wortabgleich, **keine**
  rechtliche Prüfung.
- **Markenwissen ist bearbeitbar**, inklusive Verbotsliste.
- **Rollenumschalter** in der Navigation zum Testen der Kundenansicht.

## 4. Wie du später Änderungen vornehmen lässt

Sag mir in einem neuen Chat, was sich ändern soll. Ich passe die
entsprechenden Dateien an und du bekommst das aktualisierte Projekt wieder
zum Download.

## 5. Wie wir die App bei Vercel online stellen

Das machst du über dein eigenes Vercel-Konto — ich kann das nicht direkt
ausführen. Ablauf, sobald Phase 2 abgeschlossen ist:

1. Projekt in ein GitHub-Repository laden (`.env.local` bleibt draußen,
   das übernimmt `.gitignore` automatisch)
2. Auf vercel.com mit GitHub anmelden, das Repository auswählen
3. Bei den Projekteinstellungen die drei Variablen aus `.env.example`
   mit den echten Werten hinterlegen (inkl. `NEXT_PUBLIC_REQUIRE_AUTH=true`)
4. „Deploy" klicken — du bekommst eine Live-URL

Wir machen das gemeinsam Schritt für Schritt.
