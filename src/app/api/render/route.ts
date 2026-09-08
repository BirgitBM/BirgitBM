import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { reelRendern } from "@/lib/render/ffmpeg";
import { BUCKET_BROLL, BUCKET_REELS } from "@/lib/storage";
import { dbToBroll, dbToReel } from "@/lib/mappers";

// FFmpeg braucht einen echten Node-Prozess. Die schlanke Edge-Laufzeit kann
// keine Programme starten.
export const runtime = "nodejs";
// Rendern dauert länger als eine übliche Anfrage.
export const maxDuration = 300;

/**
 * Serverseitiger Zugang zu Supabase.
 *
 * Bevorzugt wird SUPABASE_SERVICE_ROLE_KEY, falls gesetzt – der Schlüssel
 * bleibt auf dem Server, weil sein Name nicht mit NEXT_PUBLIC_ beginnt und
 * Next.js ihn deshalb nicht in den Browser ausliefert. Ohne ihn wird der
 * öffentliche Schlüssel verwendet; das genügt, solange die Zugriffsregeln
 * aus schema.sql gelten (kein Login).
 */
function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Prüft, ob FFmpeg auf diesem Rechner startbar ist. */
function ffmpegVorhanden(): Promise<boolean> {
  return new Promise((aufloesen) => {
    const p = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    p.on("error", () => aufloesen(false));
    p.on("close", (code) => aufloesen(code === 0));
  });
}

function fehler(nachricht: string, status = 400, hinweis?: string) {
  return NextResponse.json({ fehler: nachricht, hinweis }, { status });
}

export async function POST(anfrage: Request) {
  let reelId: string;
  try {
    const koerper = (await anfrage.json()) as { reelId?: string };
    if (!koerper.reelId) return fehler("Es wurde kein Reel angegeben.");
    reelId = koerper.reelId;
  } catch {
    return fehler("Die Anfrage konnte nicht gelesen werden.");
  }

  if (!(await ffmpegVorhanden())) {
    return fehler(
      "FFmpeg ist auf diesem Rechner nicht installiert.",
      503,
      "Rendern braucht FFmpeg. macOS: brew install ffmpeg · Windows: winget install Gyan.FFmpeg · Linux: sudo apt install ffmpeg. Danach ContentOS neu starten und mit „ffmpeg -version“ im Terminal prüfen.",
    );
  }

  const supabase = serverClient();
  if (!supabase) {
    return fehler(
      "Keine Verbindung zu Supabase.",
      503,
      "NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlen in .env.local.",
    );
  }

  // --- Reel laden ---
  const { data: reelZeile, error: reelFehler } = await supabase
    .from("reels")
    .select("*")
    .eq("id", reelId)
    .single();
  if (reelFehler || !reelZeile) {
    return fehler(`Reel nicht gefunden: ${reelFehler?.message ?? reelId}`, 404);
  }
  const reel = dbToReel(reelZeile);

  if (reel.brollIds.length === 0) {
    return fehler(
      "Diesem Reel ist kein B-Roll-Clip zugeordnet.",
      400,
      "Ordne dem Reel in der Content-Bibliothek mindestens einen Clip zu.",
    );
  }

  // --- Clips laden ---
  const { data: clipZeilen, error: clipFehler } = await supabase
    .from("broll")
    .select("*")
    .in("id", reel.brollIds);
  if (clipFehler) return fehler(`Clips konnten nicht geladen werden: ${clipFehler.message}`, 500);

  // Reihenfolge wie im Reel hinterlegt, nicht wie die Datenbank sie liefert.
  const clips = reel.brollIds
    .map((id) => (clipZeilen ?? []).find((z) => z.id === id))
    .filter(Boolean)
    .map((z) => dbToBroll(z as Record<string, unknown>));

  const ohneDatei = clips.filter((c) => !c.videoPfad);
  if (ohneDatei.length > 0) {
    return fehler(
      `Für ${ohneDatei.map((c) => c.id).join(", ")} liegt keine hochgeladene Videodatei vor.`,
      400,
      "Gerendert wird nur mit Dateien aus Supabase Storage. Cloud-Links (Google Drive, Dropbox, Vimeo) liefern keine direkt ladbare Datei. Lade die Clips in der B-Roll-Bibliothek hoch.",
    );
  }

  await supabase
    .from("reels")
    .update({ render_status: "laeuft", render_fehler: null })
    .eq("id", reelId);

  const arbeitsordner = await mkdtemp(join(tmpdir(), "contentos-reel-"));
  try {
    // --- Clips herunterladen ---
    const lokaleClips: { pfad: string }[] = [];
    for (const clip of clips) {
      const { data, error } = await supabase.storage
        .from(BUCKET_BROLL)
        .download(clip.videoPfad as string);
      if (error || !data) {
        throw new Error(
          `Clip ${clip.id} konnte nicht geladen werden: ${error?.message ?? "unbekannt"}`,
        );
      }
      const ziel = join(arbeitsordner, `${clip.id}.mp4`);
      await writeFile(ziel, Buffer.from(await data.arrayBuffer()));
      lokaleClips.push({ pfad: ziel });
    }

    // --- Rendern ---
    const zielDatei = join(arbeitsordner, "reel.mp4");
    const ergebnis = await reelRendern({
      clips: lokaleClips,
      overlays: reel.textOverlays,
      ziel: zielDatei,
    });

    // --- Ergebnis hochladen ---
    const fertig = await readFile(zielDatei);
    const pfad = `${reelId}/${Date.now()}.mp4`;
    const { error: uploadFehler } = await supabase.storage
      .from(BUCKET_REELS)
      .upload(pfad, fertig, { contentType: "video/mp4", upsert: false });
    if (uploadFehler) {
      throw new Error(
        `Fertiges Video konnte nicht gespeichert werden: ${uploadFehler.message}. Gibt es den Bucket „${BUCKET_REELS}“?`,
      );
    }

    // Vorherige Fassung entfernen, damit sich keine alten Dateien ansammeln.
    if (reel.videoPfad && reel.videoPfad !== pfad) {
      await supabase.storage.from(BUCKET_REELS).remove([reel.videoPfad]);
    }

    await supabase
      .from("reels")
      .update({
        video_pfad: pfad,
        video_dauer_sekunden: ergebnis.dauer,
        render_status: "fertig",
        render_fehler: null,
        gerendert_am: new Date().toISOString(),
      })
      .eq("id", reelId);

    return NextResponse.json({
      pfad,
      dauer: ergebnis.dauer,
      verwendeteClips: ergebnis.verwendeteClips,
      uebersprungeneOverlays: ergebnis.uebersprungeneOverlays,
    });
  } catch (ausnahme) {
    const nachricht = ausnahme instanceof Error ? ausnahme.message : String(ausnahme);
    await supabase
      .from("reels")
      .update({ render_status: "fehler", render_fehler: nachricht.slice(0, 1000) })
      .eq("id", reelId);
    return fehler(nachricht, 500);
  } finally {
    await rm(arbeitsordner, { recursive: true, force: true });
  }
}
