# Render-Kern

Erzeugt aus B-Roll-Clips und Textoverlays ein fertiges Instagram-Reel
(9:16, 1080x1920, 30 fps, h264, höchstens 30 Sekunden).

## Stand

Vollständig angebunden: Upload in der B-Roll-Bibliothek, Server-Route
`/api/render`, Knöpfe „Video erstellen" und „MP4 herunterladen" in der
Content-Bibliothek. Die Einrichtung steht im Haupt-README unter „3e".

Gerendert wird nur mit **hochgeladenen** Dateien aus dem Bucket
`broll-videos`. Cloud-Links geben dem Server keine ladbare Datei zurück,
sondern eine Webseite — sie sind zum Rendern ungeeignet und werden mit einer
klaren Meldung abgelehnt statt still zu scheitern.

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
| 4 Abschnitte auf 3 Clips | jeder Clip kommt vor, lückenlos (0–11 / 11–16 / 16–20 s) |
| 2 Abschnitte auf 5 Clips | gleichmässig nach Zeit geteilt, kein Clip fällt weg |
| FFmpeg fehlt | Route antwortet mit Installationshinweis je Betriebssystem |
| Supabase nicht eingerichtet | Route nennt die fehlenden Umgebungsvariablen |
| Clip ohne hochgeladene Datei | Route lehnt ab und erklärt, warum ein Link nicht reicht |

Renderdauer für 15 Sekunden: rund 4 bis 5 Sekunden auf einem einfachen Rechner.
