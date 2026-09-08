// Prüfung und Aufbereitung von Video-Links.
//
// Wichtig: Ein gespeicherter Link wird in der Oberfläche als anklickbare
// Adresse ausgegeben. Ohne Prüfung liesse sich dort "javascript:..."
// hinterlegen und beim Klick Schadcode ausführen. Deshalb sind nur http und
// https erlaubt – geprüft wird sowohl hier als auch in der Datenbank.

export function istSichererVideoLink(url: string): boolean {
  const text = url.trim();
  if (!text) return false;
  try {
    const geprueft = new URL(text);
    return geprueft.protocol === "http:" || geprueft.protocol === "https:";
  } catch {
    return false;
  }
}

/** Gibt den Link zurück, wenn er sicher ist – sonst undefined. */
export function sichererVideoLink(url?: string): string | undefined {
  if (!url) return undefined;
  return istSichererVideoLink(url) ? url.trim() : undefined;
}

/** Erkennt den Dienst, damit die Oberfläche ihn benennen kann. */
export function videoDienst(url?: string): string {
  const sicher = sichererVideoLink(url);
  if (!sicher) return "Video";
  const host = new URL(sicher).hostname.replace(/^www\./, "");
  if (host.includes("drive.google")) return "Google Drive";
  if (host.includes("dropbox")) return "Dropbox";
  if (host.includes("wetransfer")) return "WeTransfer";
  if (host.includes("icloud")) return "iCloud";
  if (host.includes("onedrive") || host.includes("1drv")) return "OneDrive";
  if (host.includes("vimeo")) return "Vimeo";
  if (host.includes("youtu")) return "YouTube";
  return host;
}
