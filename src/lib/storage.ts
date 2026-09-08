import { supabase } from "./supabaseClient";

// Namen der beiden privaten Buckets. Privat heisst: Der Zugriff läuft über
// zeitlich begrenzte Adressen, die die Anwendung bei Bedarf erzeugt.
export const BUCKET_BROLL = "broll-videos";
export const BUCKET_REELS = "reels-fertig";

/** Wie lange eine erzeugte Adresse gültig ist (eine Stunde). */
export const SIGNIERT_GUELTIG_SEKUNDEN = 3600;

/**
 * Obergrenze für hochgeladene Rohclips.
 *
 * B-Roll für ein Reel ist typischerweise 5 bis 15 Sekunden lang und damit
 * deutlich kleiner. Die Grenze fängt vor allem versehentlich gewählte
 * Langvideos ab, bevor sie Speicherplatz und Datenverkehr kosten.
 */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB

export function groesseLesbar(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Dateiendung aus dem Namen, klein geschrieben, ohne Punkt. */
function endung(dateiname: string): string {
  const teil = dateiname.split(".").pop();
  return teil && teil.length <= 5 ? teil.toLowerCase() : "mp4";
}

/**
 * Lädt einen Rohclip hoch und gibt den Pfad im Bucket zurück.
 *
 * Der Upload läuft direkt vom Browser zu Supabase – die Datei geht nicht
 * durch die Anwendung. Das ist schneller und belastet den Server nicht.
 */
export async function brollHochladen(
  clipId: string,
  datei: File,
): Promise<{ pfad: string; groesse: number }> {
  if (datei.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Die Datei ist ${groesseLesbar(datei.size)} gross. Erlaubt sind bis zu ${groesseLesbar(MAX_UPLOAD_BYTES)}.`,
    );
  }
  if (!datei.type.startsWith("video/")) {
    throw new Error("Das ist keine Videodatei. Erwartet wird zum Beispiel MP4 oder MOV.");
  }

  const pfad = `${clipId}/${Date.now()}.${endung(datei.name)}`;
  const { error } = await supabase.storage.from(BUCKET_BROLL).upload(pfad, datei, {
    contentType: datei.type,
    upsert: false,
  });
  if (error) {
    throw new Error(
      `Hochladen fehlgeschlagen: ${error.message}. Gibt es den Bucket „${BUCKET_BROLL}“ in Supabase?`,
    );
  }
  return { pfad, groesse: datei.size };
}

/** Entfernt eine Datei aus einem Bucket. Fehler werden bewusst geschluckt:
 *  Ein verwaister Rest ist weniger schlimm als ein abgebrochener Vorgang. */
export async function dateiEntfernen(bucket: string, pfad?: string): Promise<void> {
  if (!pfad) return;
  await supabase.storage.from(bucket).remove([pfad]);
}

/**
 * Erzeugt eine zeitlich begrenzte Adresse zum Ansehen oder Herunterladen.
 * Ohne diese Adresse ist die Datei nicht erreichbar – die Buckets sind privat.
 */
export async function signierteAdresse(
  bucket: string,
  pfad: string,
  herunterladenAls?: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pfad, SIGNIERT_GUELTIG_SEKUNDEN,
      herunterladenAls ? { download: herunterladenAls } : undefined);
  if (error || !data) {
    throw new Error(`Adresse konnte nicht erzeugt werden: ${error?.message ?? "unbekannt"}`);
  }
  return data.signedUrl;
}
