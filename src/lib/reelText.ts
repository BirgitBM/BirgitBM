import { BRollClip, ReelCard } from "./types";

// Setzt ein Reel als einfachen Text zusammen – zum Kopieren und Weitergeben
// an die Person, die das Reel dreht und schneidet.
export function reelAlsText(reel: ReelCard, clips: BRollClip[]): string {
  const zeilen: string[] = [];
  zeilen.push(reel.thema.trim());
  zeilen.push("");
  zeilen.push(`Marke: ${reel.marke}`);
  zeilen.push(`Zielgruppe: ${reel.zielgruppe}`);
  zeilen.push(`Ziel: ${reel.ziel}`);
  if (reel.produkt) zeilen.push(`Produkt: ${reel.produkt}`);
  zeilen.push(`Status: ${reel.status}`);
  zeilen.push("");
  zeilen.push("HOOK");
  zeilen.push(reel.hook.trim());
  zeilen.push("");
  zeilen.push("B-ROLL");
  if (clips.length > 0) {
    clips.forEach((clip) => zeilen.push(`${clip.id} – ${clip.titel}`));
  } else {
    zeilen.push("Noch kein Clip zugeordnet");
  }
  if (reel.brollEmpfehlung.trim()) zeilen.push(reel.brollEmpfehlung.trim());
  zeilen.push("");
  zeilen.push("TEXTOVERLAY");
  reel.textOverlays.forEach((o) => {
    const zeit = o.zeit.trim();
    zeilen.push(zeit ? `${zeit}  ${o.text}` : o.text);
  });
  zeilen.push("");
  zeilen.push("CAPTION");
  zeilen.push(reel.caption.trim());
  zeilen.push("");
  zeilen.push("CTA");
  zeilen.push(reel.cta.trim());
  return zeilen.join("\n");
}

// Sucht Wörter aus der Verbotsliste des Markenwissens im gesamten Text.
//
// Hintergrund: Aussagen wie "Wundermittel" oder "garantiert faltenfrei" sind
// in der Kosmetikwerbung heikel. Das ist ein einfacher Wortabgleich und
// ersetzt keine rechtliche Prüfung – er fängt nur das Offensichtliche ab.
export function gefundeneWarnwoerter(reel: ReelCard, warnWoerter: string[]): string[] {
  const text = [reel.thema, reel.hook, reel.caption, reel.cta]
    .concat(reel.textOverlays.map((o) => o.text))
    .join(" ")
    .toLowerCase();
  return warnWoerter.filter((wort) => {
    const gesucht = wort.trim().toLowerCase();
    return gesucht.length > 0 && text.includes(gesucht);
  });
}
