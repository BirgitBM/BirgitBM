import { GOAL_LABELS, STATUS_LABELS } from "./labels";
import type { BrollClip, ContentItem } from "./types";

/**
 * Setzt einen Inhalt als einfachen Text zusammen – zum Kopieren und
 * Weitergeben an die Person, die das Reel dreht und schneidet.
 */
export function contentAlsText(
  item: ContentItem,
  clips: BrollClip[],
): string {
  const zeilen: string[] = [];
  zeilen.push(item.thema.trim());
  zeilen.push("");
  zeilen.push(`Ziel: ${GOAL_LABELS[item.goal]}`);
  if (item.produkt) zeilen.push(`Produkt: ${item.produkt}`);
  zeilen.push(`Status: ${STATUS_LABELS[item.status]}`);
  zeilen.push("");
  zeilen.push("HOOK");
  zeilen.push(item.hook.trim());
  zeilen.push("");
  zeilen.push("B-ROLL");
  if (clips.length > 0) {
    clips.forEach((clip) => zeilen.push(`${clip.code} – ${clip.titel}`));
  } else {
    zeilen.push("Noch kein Clip zugeordnet");
  }
  if (item.brollHinweis.trim()) zeilen.push(item.brollHinweis.trim());
  zeilen.push("");
  zeilen.push("TEXTOVERLAY");
  item.overlays.forEach((overlay) => {
    const zeit = overlay.zeit.trim();
    zeilen.push(zeit ? `${zeit}  ${overlay.text}` : overlay.text);
  });
  zeilen.push("");
  zeilen.push("CAPTION");
  zeilen.push(item.caption.trim());
  zeilen.push("");
  zeilen.push("CALL-TO-ACTION");
  zeilen.push(item.cta.trim());
  return zeilen.join("\n");
}

/**
 * Sucht Wörter aus der Verbotsliste im gesamten Text eines Inhalts.
 *
 * Hintergrund: Aussagen wie „Wundermittel" oder „garantiert faltenfrei" sind in
 * der Kosmetikwerbung heikel. Die Prüfung ist ein einfacher Wortabgleich und
 * ersetzt keine rechtliche Beratung – sie fängt nur das Offensichtliche ab.
 */
export function gefundeneWarnwoerter(
  item: ContentItem,
  warnWoerter: string[],
): string[] {
  const text = [item.thema, item.hook, item.caption, item.cta]
    .concat(item.overlays.map((overlay) => overlay.text))
    .join(" ")
    .toLowerCase();
  return warnWoerter.filter((wort) => {
    const gesucht = wort.trim().toLowerCase();
    return gesucht.length > 0 && text.includes(gesucht);
  });
}
