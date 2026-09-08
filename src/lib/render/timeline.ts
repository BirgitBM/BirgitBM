// Reine Rechenlogik für das Rendern – ohne FFmpeg, ohne Dateisystem.
// Absichtlich getrennt, damit sie ohne Video geprüft werden kann.

export interface RohOverlay {
  zeit: string;
  text: string;
}

export interface Segment {
  start: number; // Sekunden
  ende: number; // Sekunden
  text: string;
}

export const MAX_DAUER_SEKUNDEN = 30;

/**
 * Liest ein Zeitfenster aus der Textangabe.
 *
 * Unterstützt die Schreibweisen, die im Dashboard vorkommen:
 *   "0:00–0:03"  "0:00-0:03"  "0-3s"  "0-3"  "12-18s"  "1:05–1:20"
 *
 * Rückgabe in Sekunden, oder null wenn nichts Verwertbares drinsteht.
 */
export function zeitfensterLesen(zeit: string): { start: number; ende: number } | null {
  const bereinigt = zeit.replace(/\s|s(?![a-z])/gi, "").replace(/[–—]/g, "-");
  const teile = bereinigt.split("-");
  if (teile.length !== 2) return null;

  const alsSekunden = (wert: string): number | null => {
    if (!wert) return null;
    if (wert.includes(":")) {
      const [min, sek] = wert.split(":");
      const m = Number(min);
      const s = Number(sek);
      if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
      return m * 60 + s;
    }
    const n = Number(wert);
    return Number.isFinite(n) ? n : null;
  };

  const start = alsSekunden(teile[0]);
  const ende = alsSekunden(teile[1]);
  if (start === null || ende === null) return null;
  if (ende <= start || start < 0) return null;
  return { start, ende };
}

/**
 * Baut aus den Overlays die Zeitleiste.
 *
 * - Overlays ohne verwertbare Zeitangabe werden übersprungen.
 * - Überschneidungen werden nicht korrigiert: FFmpeg blendet dann beide ein,
 *   was in der Vorschau sofort auffällt. Stilles Verschieben wäre schlimmer.
 * - Die Gesamtlänge ergibt sich aus dem spätesten Ende, gedeckelt bei 30 s.
 */
export function zeitleisteBauen(overlays: RohOverlay[]): {
  segmente: Segment[];
  gesamtdauer: number;
  uebersprungen: string[];
} {
  const segmente: Segment[] = [];
  const uebersprungen: string[] = [];

  for (const overlay of overlays) {
    const text = overlay.text.trim();
    const fenster = zeitfensterLesen(overlay.zeit);
    if (!fenster || !text) {
      if (text) uebersprungen.push(`${overlay.zeit || "(ohne Zeit)"}: ${text}`);
      continue;
    }
    if (fenster.start >= MAX_DAUER_SEKUNDEN) {
      uebersprungen.push(`${overlay.zeit}: ${text} (liegt hinter ${MAX_DAUER_SEKUNDEN} s)`);
      continue;
    }
    segmente.push({
      start: fenster.start,
      ende: Math.min(fenster.ende, MAX_DAUER_SEKUNDEN),
      text,
    });
  }

  segmente.sort((a, b) => a.start - b.start);
  const gesamtdauer = segmente.length
    ? Math.min(Math.max(...segmente.map((s) => s.ende)), MAX_DAUER_SEKUNDEN)
    : 0;

  return { segmente, gesamtdauer, uebersprungen };
}

/**
 * Verteilt die vorhandenen Clips auf die Zeitleiste.
 *
 * Ein Clip: läuft durch, wird bei Bedarf wiederholt.
 * Mehrere Clips: an den Textabschnitten ausgerichtet, damit der Bildwechsel
 * mit dem Textwechsel zusammenfällt statt mitten im Satz.
 */
export function clipsVerteilen(
  clipAnzahl: number,
  segmente: Segment[],
  gesamtdauer: number,
): Array<{ clipIndex: number; start: number; dauer: number }> {
  if (clipAnzahl <= 0 || gesamtdauer <= 0) return [];
  if (clipAnzahl === 1) return [{ clipIndex: 0, start: 0, dauer: gesamtdauer }];

  // Schnittpunkte: Anfang jedes Textabschnitts, dazu 0 und das Ende.
  const punkte = Array.from(new Set([0, ...segmente.map((s) => s.start), gesamtdauer]))
    .filter((p) => p >= 0 && p <= gesamtdauer)
    .sort((a, b) => a - b);

  const abschnitte = punkte.length - 1; // Zahl der Zeitabschnitte

  // Weniger Abschnitte als Clips: gleichmässig nach Zeit teilen. Sonst
  // bekämen die übrigen Clips gar keine Zeit und würden verschwinden.
  if (abschnitte < clipAnzahl) {
    const dauer = gesamtdauer / clipAnzahl;
    return Array.from({ length: clipAnzahl }, (_, i) => ({
      clipIndex: i,
      start: i * dauer,
      dauer,
    }));
  }

  // Abschnitte so auf die Clips verteilen, dass sich die Anzahl je Clip um
  // höchstens eins unterscheidet. Jeder Clip kommt garantiert vor.
  const grundzahl = Math.floor(abschnitte / clipAnzahl);
  const rest = abschnitte % clipAnzahl;

  const verteilung: Array<{ clipIndex: number; start: number; dauer: number }> = [];
  let index = 0;
  for (let i = 0; i < clipAnzahl; i++) {
    const anzahl = grundzahl + (i < rest ? 1 : 0);
    const start = punkte[index];
    const ende = punkte[index + anzahl];
    index += anzahl;
    verteilung.push({ clipIndex: i, start, dauer: ende - start });
  }
  return verteilung;
}

/**
 * Bricht Text auf mehrere Zeilen um.
 *
 * FFmpeg bricht nicht selbst um: ohne Umbruch läuft langer Text aus dem Bild.
 * `maxZeichen` ist auf 1080 px Breite und die verwendete Schriftgröße
 * abgestimmt.
 */
export function textUmbrechen(text: string, maxZeichen = 26): string[] {
  const woerter = text.trim().split(/\s+/);
  const zeilen: string[] = [];
  let aktuell = "";

  for (const wort of woerter) {
    if (!aktuell) {
      aktuell = wort;
    } else if ((aktuell + " " + wort).length <= maxZeichen) {
      aktuell += " " + wort;
    } else {
      zeilen.push(aktuell);
      aktuell = wort;
    }
  }
  if (aktuell) zeilen.push(aktuell);
  return zeilen.length ? zeilen : [""];
}
