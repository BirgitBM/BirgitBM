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
