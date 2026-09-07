"use client";

import type { ReactNode } from "react";
import {
  AutoInput,
  AutoTextarea,
  Card,
  StatusBadge,
  Tag,
  cx,
} from "@/components/ui";
import { AUDIENCE_LABELS, GOAL_LABELS, VISIBILITY_LABELS } from "@/lib/labels";
import type { BrollClip, ContentItem, TextOverlay } from "@/lib/types";

function Abschnitt({
  titel,
  hinweis,
  children,
}: {
  titel: string;
  hinweis?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {titel}
        </h3>
        {hinweis}
      </div>
      <div className="mt-1.5 text-sm text-slate-800">{children}</div>
    </div>
  );
}

/**
 * Reel-Karte.
 *
 * Wird `onChange` übergeben, sind alle Texte direkt in der Karte änderbar
 * (Thema, Hook, Overlays, Caption, CTA, B-Roll-Hinweis). Ohne `onChange` ist
 * die Karte reine Anzeige – so wird sie später für Kundenzugänge verwendet.
 */
export function ReelKarte({
  item,
  broll,
  aktionen,
  onChange,
}: {
  item: ContentItem;
  broll: BrollClip[];
  aktionen?: ReactNode;
  onChange?: (neu: ContentItem) => void;
}) {
  const clips = broll.filter((clip) => item.brollIds.includes(clip.id));
  const bearbeitbar = typeof onChange === "function";

  function aendern(teil: Partial<ContentItem>) {
    onChange?.({ ...item, ...teil, updatedAt: new Date().toISOString() });
  }

  function overlayAendern(index: number, teil: Partial<TextOverlay>) {
    aendern({
      overlays: item.overlays.map((overlay, i) =>
        i === index ? { ...overlay, ...teil } : overlay,
      ),
    });
  }

  function overlayEntfernen(index: number) {
    aendern({ overlays: item.overlays.filter((_, i) => i !== index) });
  }

  function overlayHinzufuegen() {
    aendern({ overlays: [...item.overlays, { zeit: "", text: "" }] });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {bearbeitbar ? (
            <AutoTextarea
              wert={item.thema}
              onChange={(thema) => aendern({ thema })}
              label="Thema"
              placeholder="Thema des Reels"
              textKlassen="px-2 py-1 text-base font-semibold text-slate-900"
            />
          ) : (
            <p className="text-base font-semibold text-slate-900">{item.thema}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag>{GOAL_LABELS[item.goal]}</Tag>
            <Tag>{AUDIENCE_LABELS[item.audience]}</Tag>
            {item.produkt && <Tag>{item.produkt}</Tag>}
            <Tag>{VISIBILITY_LABELS[item.visibility]}</Tag>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {bearbeitbar && (
        <p className="border-b border-slate-100 bg-marke-50/50 px-5 py-2.5 text-xs text-marke-900">
          Alle Texte auf dieser Karte kannst du direkt anklicken und selbst
          überschreiben. Vergiss danach das Speichern nicht.
        </p>
      )}

      <div className="space-y-5 px-5 py-5">
        <Abschnitt titel="Hook">
          {bearbeitbar ? (
            <AutoTextarea
              wert={item.hook}
              onChange={(hook) => aendern({ hook })}
              label="Hook"
              placeholder="Der erste Satz, der den Scroll stoppt"
              rahmen="bg-marke-50 ring-marke-200"
              textKlassen="px-4 py-3 font-medium text-marke-900"
            />
          ) : (
            <p className="rounded-xl bg-marke-50 px-4 py-3 font-medium text-marke-900 ring-1 ring-inset ring-marke-200">
              {item.hook}
            </p>
          )}
        </Abschnitt>

        <Abschnitt titel="B-Roll-Empfehlung">
          <div className="space-y-2">
            {clips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {clips.map((clip) => (
                  <span
                    key={clip.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    <span
                      className="h-4 w-6 rounded"
                      style={{ backgroundColor: clip.vorschauFarbe }}
                      aria-hidden
                    />
                    {clip.code} · {clip.titel}
                  </span>
                ))}
              </div>
            )}
            {bearbeitbar ? (
              <AutoTextarea
                wert={item.brollHinweis}
                onChange={(brollHinweis) => aendern({ brollHinweis })}
                label="B-Roll-Hinweis"
                placeholder="Hinweis zur Bildsprache"
                textKlassen="px-2 py-1 text-slate-600"
              />
            ) : (
              <p className="text-sm text-slate-600">{item.brollHinweis}</p>
            )}
          </div>
        </Abschnitt>

        <Abschnitt
          titel="Textoverlay"
          hinweis={
            bearbeitbar ? (
              <button
                type="button"
                onClick={overlayHinzufuegen}
                className="text-xs font-medium text-marke-700 hover:text-marke-800"
              >
                Zeile hinzufügen
              </button>
            ) : undefined
          }
        >
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {item.overlays.map((overlay, index) => (
              <li
                key={index}
                className={cx(
                  "flex gap-2 px-2.5",
                  bearbeitbar ? "items-start py-1.5" : "px-3.5 py-2.5",
                )}
              >
                {bearbeitbar ? (
                  <>
                    <div className="w-[4.5rem] shrink-0 pt-0.5">
                      <AutoInput
                        wert={overlay.zeit}
                        onChange={(zeit) => overlayAendern(index, { zeit })}
                        label={`Zeitangabe Zeile ${index + 1}`}
                        placeholder="0-2s"
                        textKlassen="px-2 py-1 font-mono text-xs text-slate-500"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <AutoTextarea
                        wert={overlay.text}
                        onChange={(text) => overlayAendern(index, { text })}
                        label={`Overlay-Text Zeile ${index + 1}`}
                        placeholder="Text im Bild"
                        textKlassen="px-2 py-1 text-slate-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => overlayEntfernen(index)}
                      className="shrink-0 rounded px-1.5 py-1 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Zeile ${index + 1} entfernen`}
                    >
                      Entfernen
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-14 shrink-0 font-mono text-xs text-slate-500">
                      {overlay.zeit}
                    </span>
                    <span className="text-sm text-slate-800">{overlay.text}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Abschnitt>

        <Abschnitt titel="Caption">
          {bearbeitbar ? (
            <AutoTextarea
              wert={item.caption}
              onChange={(caption) => aendern({ caption })}
              label="Caption"
              placeholder="Text unter dem Beitrag"
              rahmen="bg-slate-50 ring-slate-200"
              textKlassen="px-4 py-3 text-slate-700"
            />
          ) : (
            <p className="whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-slate-700 ring-1 ring-inset ring-slate-200">
              {item.caption}
            </p>
          )}
        </Abschnitt>

        <Abschnitt titel="Call-to-Action">
          {bearbeitbar ? (
            <AutoTextarea
              wert={item.cta}
              onChange={(cta) => aendern({ cta })}
              label="Call-to-Action"
              placeholder="Was soll die Zuschauerin tun?"
              textKlassen="px-2 py-1 text-slate-800"
            />
          ) : (
            <p className="text-slate-800">{item.cta}</p>
          )}
        </Abschnitt>
      </div>

      {aktionen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          {aktionen}
        </div>
      )}
    </Card>
  );
}
