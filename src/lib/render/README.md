# Render-Kern

Erzeugt aus B-Roll-Clips und Textoverlays ein fertiges Instagram-Reel
(9:16, 1080x1920, 30 fps, h264, höchstens 30 Sekunden).

## Stand

Der Kern ist gebaut und geprüft. **Noch nicht angebunden sind:**

- die API-Route, die ihn aufruft
- die Knöpfe „Video erstellen" und „MP4 herunterladen" im Dashboard
- die Quelle der Videodateien

Der letzte Punkt ist die offene Entscheidung: Zum Rendern muss der Server die
Videodateien öffnen können. Cloud-Links (Google Drive, Dropbox, Vimeo) geben
in aller Regel keine direkt ladbare Datei zurück, sondern eine Webseite.
Zuverlässig wird es erst mit echten Dateien in Supabase Storage.

## Dateien

- `timeline.ts` – reine Rechenlogik ohne FFmpeg: Zeitfenster lesen,
  Gesamtlänge bestimmen, Clips auf die Textabschnitte verteilen, Text
  umbrechen. Absichtlich getrennt, damit sie ohne Video prüfbar ist.
- `ffmpeg.ts` – baut daraus den FFmpeg-Aufruf und startet ihn.

## Voraussetzung

FFmpeg muss auf dem Rechner installiert sein, der rendert.

```bash
ffmpeg -version    # muss eine Version ausgeben
```

## Selbst prüfen

```bash
npx tsx scripts/render-test.mts /pfad/zu/einem/arbeitsordner
```

Das Skript erwartet dort `clipA.mp4` und `clipB.mp4` und legt `reel.mp4` an.
Testclips erzeugen:

```bash
ffmpeg -f lavfi -i "testsrc2=size=1280x720:rate=25:duration=4" -pix_fmt yuv420p clipA.mp4
ffmpeg -f lavfi -i "smptebars=size=640x480:rate=25:duration=3" -pix_fmt yuv420p clipB.mp4
```

## Geprüftes Verhalten

| Fall | Ergebnis |
| --- | --- |
| Overlays 0–3, 3–10, 10–15 s | Video wird 15,0 s lang |
| Zwei Clips, 16:9 und 4:3 | beide formatfüllend auf 1080x1920 zugeschnitten |
| Bildwechsel | liegt auf dem Textwechsel, nicht mitten im Satz |
| Ein Clip von 3 s auf 20 s Länge | wird wiederholt, keine schwarzen Bilder (Helligkeit bei 18 s: 94,5 – bei 1 s: 95,9) |
| Overlay 25–45 s | auf 30 s gekürzt |
| Overlay 40–50 s | übersprungen, mit Begründung im Ergebnis |
| Zeitangabe „kaputt" | übersprungen, mit Begründung im Ergebnis |
| Umlaute und Sonderzeichen | korrekt dargestellt (Text kommt aus einer Datei, keine Maskierung nötig) |

Renderdauer für 15 Sekunden: rund 4 bis 5 Sekunden auf einem einfachen Rechner.
