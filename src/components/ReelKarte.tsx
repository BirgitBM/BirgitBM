"use client";

import { ReactNode } from "react";
import { AutoInput, AutoTextarea, Card, StatusPill } from "@/components/ui";
import { gefundeneWarnwoerter } from "@/lib/reelText";
import { BRollClip, ContentStatus, ReelCard, TextOverlay } from "@/lib/types";

const statusOptionen: ContentStatus[] = [
  "Idee",
  "Entwurf",
  "Freigegeben",
  "Produziert",
  "Veröffentlicht",
];

function Abschnitt({
  titel,
  aktion,
  children,
}: {
  titel: string;
  aktion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-medium text-taupe text-sm">{titel}</div>
        {aktion}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/**
 * Reel-Karte.
 *
 * Mit `onChange` sind alle Texte direkt in der Karte überschreibbar. Ohne
 * `onChange` ist die Karte reine Anzeige – so wird sie für Kundenzugänge
 * gebraucht.
 *
 * `brollIds` erlaubt eine abweichende Clip-Auswahl: Der Inhalt gehört der
 * Marke, die Bebilderung kann pro Kundin unterschiedlich sein.
 */
export function ReelKarte({
  reel,
  broll,
  brollIds,
  onChange,
  onBrollChange,
  onStatusChange,
  warnWoerter = [],
  aktionen,
}: {
  reel: ReelCard;
  broll: BRollClip[];
  brollIds?: string[];
  onChange?: (patch: Partial<ReelCard>) => void;
  onBrollChange?: (brollIds: string[]) => void;
  onStatusChange?: (status: ContentStatus) => void;
  warnWoerter?: string[];
  aktionen?: ReactNode;
}) {
  const aktiveIds = brollIds ?? reel.brollIds;
  const clips = aktiveIds
    .map((id) => broll.find((c) => c.id === id))
    .filter((c): c is BRollClip => Boolean(c));
  const freieClips = broll.filter((c) => !aktiveIds.includes(c.id));
  const bearbeitbar = typeof onChange === "function";
  const brollAenderbar = typeof onBrollChange === "function";
  const warnungen = gefundeneWarnwoerter(reel, warnWoerter);

  const overlayAendern = (index: number, patch: Partial<TextOverlay>) =>
    onChange?.({
      textOverlays: reel.textOverlays.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-taupe">
            {reel.marke} · {reel.zielgruppe} · {reel.ziel}
            {reel.produkt ? ` · ${reel.produkt}` : ""}
          </div>
          {bearbeitbar ? (
            <AutoTextarea
              wert={reel.thema}
              onChange={(thema) => onChange?.({ thema })}
              label="Thema"
              placeholder="Thema des Reels"
              textKlassen="px-2 py-1 font-display text-xl"
            />
          ) : (
            <div className="font-display text-xl mt-1">{reel.thema}</div>
          )}
        </div>
        {onStatusChange ? (
          <select
            value={reel.status}
            onChange={(e) => onStatusChange(e.target.value as ContentStatus)}
            aria-label="Status ändern"
            className="shrink-0 text-xs rounded-md border border-line bg-white px-2 py-1.5"
          >
            {statusOptionen.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        ) : (
          <StatusPill status={reel.status} />
        )}
      </div>

      {warnungen.length > 0 && (
        <p className="border-b border-[var(--amber)]/30 bg-[var(--amber-bg)] px-5 py-2.5 text-xs text-[var(--amber)]">
          <span className="font-medium">Vorsicht bei der Formulierung: </span>
          {warnungen.map((w) => `„${w}“`).join(", ")} steht auf der Verbotsliste im
          Markenwissen. Solche Aussagen können als Heilversprechen gelesen werden.
        </p>
      )}

      {bearbeitbar && (
        <p className="border-b border-line bg-ivory px-5 py-2.5 text-xs text-taupe">
          Alle Texte auf dieser Karte kannst du direkt anklicken und überschreiben.
          Änderungen werden sofort in Supabase gespeichert.
        </p>
      )}

      <div className="space-y-4 px-5 py-5">
        <Abschnitt titel="Hook">
          {bearbeitbar ? (
            <AutoTextarea
              wert={reel.hook}
              onChange={(hook) => onChange?.({ hook })}
              label="Hook"
              placeholder="Der erste Satz, der den Scroll stoppt"
              rahmen="bg-blush border-line"
              textKlassen="px-3 py-2 text-sm font-medium"
            />
          ) : (
            <p className="text-sm">{reel.hook}</p>
          )}
        </Abschnitt>

        <Abschnitt
          titel="B-Roll"
          aktion={
            brollAenderbar && freieClips.length > 0 ? (
              <select
                value=""
                onChange={(e) => e.target.value && onBrollChange?.([...aktiveIds, e.target.value])}
                aria-label="Clip hinzufügen"
                className="text-xs rounded-md border border-line bg-white px-2 py-1"
              >
                <option value="">Clip hinzufügen …</option>
                {freieClips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} · {c.titel}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {clips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {clips.map((clip) => (
                  <span
                    key={clip.id}
                    className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs"
                  >
                    <span
                      className="h-4 w-6 rounded"
                      style={{ backgroundColor: clip.vorschauFarbe }}
                      aria-hidden
                    />
                    {clip.id} · {clip.titel}
                    {clip.besitzer === "kunde" && (
                      <span className="text-[var(--amber)]">eigener Clip</span>
                    )}
                    {brollAenderbar && (
                      <button
                        type="button"
                        onClick={() => onBrollChange?.(aktiveIds.filter((id) => id !== clip.id))}
                        className="-mr-1 px-1 text-taupe hover:text-[var(--red)]"
                        aria-label={`${clip.id} entfernen`}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-taupe">Noch kein Clip zugeordnet.</p>
            )}
            {bearbeitbar ? (
              <AutoTextarea
                wert={reel.brollEmpfehlung}
                onChange={(brollEmpfehlung) => onChange?.({ brollEmpfehlung })}
                label="B-Roll-Hinweis"
                placeholder="Hinweis zur Bildsprache"
                textKlassen="px-2 py-1 text-sm text-taupe"
              />
            ) : (
              <p className="text-sm text-taupe">{reel.brollEmpfehlung}</p>
            )}
          </div>
        </Abschnitt>

        <Abschnitt
          titel="Textoverlay"
          aktion={
            bearbeitbar ? (
              <button
                type="button"
                onClick={() =>
                  onChange?.({ textOverlays: [...reel.textOverlays, { zeit: "", text: "" }] })
                }
                className="text-xs text-[var(--amber)] hover:underline"
              >
                Zeile hinzufügen
              </button>
            ) : undefined
          }
        >
          <ul className="rounded-md border border-line divide-y divide-line">
            {reel.textOverlays.map((o, i) => (
              <li key={i} className="flex items-start gap-2 px-2.5 py-1.5">
                {bearbeitbar ? (
                  <>
                    <div className="w-24 shrink-0 pt-0.5">
                      <AutoInput
                        wert={o.zeit}
                        onChange={(zeit) => overlayAendern(i, { zeit })}
                        label={`Zeitangabe Zeile ${i + 1}`}
                        placeholder="0:00–0:03"
                        textKlassen="px-2 py-1 text-xs text-taupe"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <AutoTextarea
                        wert={o.text}
                        onChange={(text) => overlayAendern(i, { text })}
                        label={`Overlay-Text Zeile ${i + 1}`}
                        placeholder="Text im Bild"
                        textKlassen="px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onChange?.({ textOverlays: reel.textOverlays.filter((_, x) => x !== i) })
                      }
                      className="shrink-0 px-1.5 py-1 text-xs text-taupe hover:text-[var(--red)]"
                      aria-label={`Zeile ${i + 1} entfernen`}
                    >
                      Entfernen
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-24 shrink-0 text-xs text-taupe">{o.zeit}</span>
                    <span className="text-sm">{o.text}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Abschnitt>

        <Abschnitt titel="Caption">
          {bearbeitbar ? (
            <AutoTextarea
              wert={reel.caption}
              onChange={(caption) => onChange?.({ caption })}
              label="Caption"
              placeholder="Text unter dem Beitrag"
              rahmen="bg-ivory border-line"
              textKlassen="px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-sm whitespace-pre-line">{reel.caption}</p>
          )}
        </Abschnitt>

        <Abschnitt titel="CTA">
          {bearbeitbar ? (
            <AutoTextarea
              wert={reel.cta}
              onChange={(cta) => onChange?.({ cta })}
              label="Call-to-Action"
              placeholder="Was soll die Zuschauerin tun?"
              textKlassen="px-2 py-1 text-sm"
            />
          ) : (
            <p className="text-sm">{reel.cta}</p>
          )}
        </Abschnitt>
      </div>

      {aktionen && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-ivory px-5 py-4">
          {aktionen}
        </div>
      )}
    </Card>
  );
}
