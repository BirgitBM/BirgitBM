"use client";

import type { ReactNode } from "react";
import { Card, StatusBadge, Tag } from "@/components/ui";
import {
  AUDIENCE_LABELS,
  GOAL_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/labels";
import type { BrollClip, ContentItem } from "@/lib/types";

function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {titel}
      </h3>
      <div className="mt-1.5 text-sm text-slate-800">{children}</div>
    </div>
  );
}

export function ReelKarte({
  item,
  broll,
  aktionen,
}: {
  item: ContentItem;
  broll: BrollClip[];
  aktionen?: ReactNode;
}) {
  const clips = broll.filter((clip) => item.brollIds.includes(clip.id));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">{item.thema}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag>{GOAL_LABELS[item.goal]}</Tag>
            <Tag>{AUDIENCE_LABELS[item.audience]}</Tag>
            {item.produkt && <Tag>{item.produkt}</Tag>}
            <Tag>{VISIBILITY_LABELS[item.visibility]}</Tag>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="space-y-5 px-5 py-5">
        <Abschnitt titel="Hook">
          <p className="rounded-xl bg-marke-50 px-4 py-3 font-medium text-marke-900 ring-1 ring-inset ring-marke-200">
            {item.hook}
          </p>
        </Abschnitt>

        <Abschnitt titel="B-Roll-Empfehlung">
          {clips.length > 0 ? (
            <div className="space-y-2">
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
              <p className="text-sm text-slate-600">{item.brollHinweis}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">{item.brollHinweis}</p>
          )}
        </Abschnitt>

        <Abschnitt titel="Textoverlay">
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {item.overlays.map((overlay) => (
              <li
                key={`${overlay.zeit}-${overlay.text}`}
                className="flex gap-3 px-3.5 py-2.5"
              >
                <span className="w-14 shrink-0 font-mono text-xs text-slate-500">
                  {overlay.zeit}
                </span>
                <span className="text-sm text-slate-800">{overlay.text}</span>
              </li>
            ))}
          </ul>
        </Abschnitt>

        <Abschnitt titel="Caption">
          <p className="whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-slate-700 ring-1 ring-inset ring-slate-200">
            {item.caption}
          </p>
        </Abschnitt>

        <Abschnitt titel="Call-to-Action">
          <p className="text-slate-800">{item.cta}</p>
        </Abschnitt>
      </div>

      {aktionen && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          {aktionen}
        </div>
      )}
    </Card>
  );
}
