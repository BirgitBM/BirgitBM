import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MAX_DAUER_SEKUNDEN,
  clipsVerteilen,
  textUmbrechen,
  zeitleisteBauen,
  type RohOverlay,
} from "./timeline";

// Ausgabeformat: Instagram-Reel, 9:16, 30 Bilder pro Sekunde.
export const BREITE = 1080;
export const HOEHE = 1920;
export const FPS = 30;

// Textgestaltung. Die Werte sind auf 1080 px Breite abgestimmt und auf dem
// Handy geprüft: grosse Schrift, dunkler Kasten dahinter für den Kontrast,
// und genug Abstand zum Rand, damit Instagram nichts überdeckt.
const SCHRIFTGROESSE = 62;
const ZEILENABSTAND = 18;
const RAND_SEITLICH = 90; // 8 % der Breite
const UNTERKANTE = 520; // Platz für Instagram-Bedienelemente unten
const KASTEN_RAND = 28;

export interface RenderClip {
  /** Lokaler Pfad zur Videodatei. */
  pfad: string;
}

export interface RenderAuftrag {
  clips: RenderClip[];
  overlays: RohOverlay[];
  /** Pfad der zu erzeugenden MP4-Datei. */
  ziel: string;
  schriftDatei?: string;
}

export interface RenderErgebnis {
  ziel: string;
  dauer: number;
  verwendeteClips: number;
  uebersprungeneOverlays: string[];
}

function ffmpegAusfuehren(argumente: string[]): Promise<void> {
  return new Promise((aufloesen, ablehnen) => {
    const prozess = spawn("ffmpeg", argumente, { stdio: ["ignore", "ignore", "pipe"] });
    let fehlertext = "";
    prozess.stderr.on("data", (teil) => {
      fehlertext += teil.toString();
    });
    prozess.on("error", (fehler) =>
      ablehnen(
        new Error(
          `FFmpeg konnte nicht gestartet werden: ${fehler.message}. Ist FFmpeg auf dem Server installiert?`,
        ),
      ),
    );
    prozess.on("close", (code) => {
      if (code === 0) aufloesen();
      // Nur die letzten Zeilen: FFmpeg schreibt sehr viel.
      else ablehnen(new Error(`FFmpeg-Fehler (Code ${code}):\n${fehlertext.slice(-1500)}`));
    });
  });
}

function schriftSuchen(vorgabe?: string): string {
  if (vorgabe) return vorgabe;
  return "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
}

/**
 * Erzeugt aus B-Roll-Clips und Textoverlays ein fertiges 9:16-Video.
 *
 * Ablauf:
 *  1. Zeitleiste aus den Overlay-Zeitfenstern bauen (Länge = spätestes Ende,
 *     höchstens 30 Sekunden).
 *  2. Clips auf die Zeitleiste verteilen und jeden auf 1080x1920 zuschneiden.
 *     Ein einzelner Clip wird bei Bedarf wiederholt, damit keine schwarzen
 *     Lücken entstehen.
 *  3. Texte exakt in ihren Zeitfenstern einblenden.
 */
export async function reelRendern(auftrag: RenderAuftrag): Promise<RenderErgebnis> {
  const { segmente, gesamtdauer, uebersprungen } = zeitleisteBauen(auftrag.overlays);

  if (gesamtdauer <= 0) {
    throw new Error(
      "Kein verwertbares Zeitfenster im Textoverlay. Erwartet wird zum Beispiel „0:00–0:03“ oder „0-3s“.",
    );
  }
  if (auftrag.clips.length === 0) {
    throw new Error("Diesem Reel ist kein B-Roll-Clip zugeordnet.");
  }

  const verteilung = clipsVerteilen(auftrag.clips.length, segmente, gesamtdauer);
  const arbeitsordner = await mkdtemp(join(tmpdir(), "contentos-render-"));

  try {
    const argumente: string[] = ["-y"];

    // Jeden Clip als Eingabe, in Schleife – so entstehen keine schwarzen
    // Lücken, wenn ein Clip kürzer ist als sein Abschnitt.
    for (const teil of verteilung) {
      argumente.push("-stream_loop", "-1", "-t", teil.dauer.toFixed(3));
      argumente.push("-i", auftrag.clips[teil.clipIndex].pfad);
    }

    const filter: string[] = [];

    // Jeden Clip formatfüllend auf 9:16 bringen: hochskalieren, dann mittig
    // beschneiden. Kein Verzerren, keine schwarzen Balken.
    verteilung.forEach((teil, i) => {
      filter.push(
        `[${i}:v]scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=increase,` +
          `crop=${BREITE}:${HOEHE},setsar=1,fps=${FPS},` +
          `trim=duration=${teil.dauer.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`,
      );
    });

    let letzterKnoten: string;
    if (verteilung.length === 1) {
      letzterKnoten = "v0";
    } else {
      const eingaenge = verteilung.map((_, i) => `[v${i}]`).join("");
      filter.push(`${eingaenge}concat=n=${verteilung.length}:v=1:a=0[zusammen]`);
      letzterKnoten = "zusammen";
    }

    // Texte einblenden. Der Text kommt aus einer Datei: so müssen
    // Sonderzeichen wie : ' % \ nicht mühsam maskiert werden.
    const schrift = schriftSuchen(auftrag.schriftDatei);
    for (let i = 0; i < segmente.length; i++) {
      const segment = segmente[i];
      const zeilen = textUmbrechen(segment.text);
      const textDatei = join(arbeitsordner, `text-${i}.txt`);
      await writeFile(textDatei, zeilen.join("\n"), "utf8");

      const blockHoehe = zeilen.length * (SCHRIFTGROESSE + ZEILENABSTAND);
      const y = HOEHE - UNTERKANTE - blockHoehe;
      const naechster = i === segmente.length - 1 ? "mitText" : `t${i}`;

      filter.push(
        `[${letzterKnoten}]drawtext=` +
          `fontfile='${schrift}':` +
          `textfile='${textDatei}':` +
          `fontsize=${SCHRIFTGROESSE}:` +
          `fontcolor=white:` +
          `line_spacing=${ZEILENABSTAND}:` +
          `box=1:boxcolor=black@0.55:boxborderw=${KASTEN_RAND}:` +
          `x=(w-text_w)/2:` +
          `y=${y}:` +
          `enable='between(t,${segment.start},${segment.ende})'` +
          `[${naechster}]`,
      );
      letzterKnoten = naechster;
    }

    argumente.push("-filter_complex", filter.join(";"));
    argumente.push("-map", `[${letzterKnoten}]`);
    argumente.push("-t", gesamtdauer.toFixed(3));
    argumente.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "23");
    argumente.push("-pix_fmt", "yuv420p"); // sonst spielt es auf manchen Geräten nicht ab
    argumente.push("-movflags", "+faststart"); // startet schneller beim Abspielen
    argumente.push("-an"); // vorerst ohne Ton
    argumente.push(auftrag.ziel);

    await ffmpegAusfuehren(argumente);

    return {
      ziel: auftrag.ziel,
      dauer: Math.min(gesamtdauer, MAX_DAUER_SEKUNDEN),
      verwendeteClips: verteilung.length,
      uebersprungeneOverlays: uebersprungen,
    };
  } finally {
    await rm(arbeitsordner, { recursive: true, force: true });
  }
}
