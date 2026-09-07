"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, StatusPill } from "@/components/ui";
import { ContentStatus, ContentZiel, WochenplanEintrag } from "@/lib/types";

const statusOptionen: ContentStatus[] = ["Idee", "Entwurf", "Freigegeben", "Produziert", "Veröffentlicht"];

const beispielMischung: { tag: string; thema: string; ziel: ContentZiel }[] = [
  { tag: "Montag", thema: "Behandlungsmythos aufklären", ziel: "Education" },
  { tag: "Dienstag", thema: "Produkt im Detail", ziel: "Produktverkauf" },
  { tag: "Mittwoch", thema: "Warum diese Behandlung wirkt", ziel: "Behandlung verkaufen" },
  { tag: "Donnerstag", thema: "Ein Blick hinter die Kulissen", ziel: "Reichweite" },
  { tag: "Freitag", thema: "Häufig gestellte Frage beantwortet", ziel: "Education" },
];

export default function WochenplanPage() {
  const { wochenplan, updateWochenplanEintrag, addWochenplanEintraege, broll } = useStore();

  const neueWoche = () => {
    const neu: WochenplanEintrag[] = beispielMischung.map((b, i) => ({
      id: `W${Date.now()}${i}`,
      tag: b.tag,
      thema: b.thema,
      ziel: b.ziel,
      status: "Idee",
      brollId: broll[i % broll.length]?.id,
    }));
    addWochenplanEintraege(neu);
  };

  return (
    <div>
      <PageHeader
        title="Wochenplan"
        subtitle="Mischung aus Education, Produkt-, Verkaufs- und Reichweitenreels für die Woche."
      />

      <div className="mb-6">
        <Button onClick={neueWoche}>5 Reels für diese Woche erstellen</Button>
      </div>

      <div className="space-y-3">
        {wochenplan.map((eintrag) => {
          const clip = broll.find((b) => b.id === eintrag.brollId);
          return (
            <Card key={eintrag.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-24 shrink-0 text-sm font-medium text-taupe">{eintrag.tag}</div>
                <div className="flex-1">
                  <div className="font-medium">{eintrag.thema}</div>
                  <div className="text-sm text-taupe mt-0.5">
                    {eintrag.ziel}{clip ? ` · B-Roll: ${clip.id} – ${clip.titel}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={eintrag.status} />
                  <select
                    value={eintrag.status}
                    onChange={(e) => updateWochenplanEintrag(eintrag.id, { status: e.target.value as ContentStatus })}
                    className="text-xs rounded-md border border-line bg-white px-2 py-1.5"
                  >
                    {statusOptionen.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
