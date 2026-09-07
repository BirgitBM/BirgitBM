"use client";

import { useStore } from "@/lib/store";
import { Card, PageHeader, StatusPill, Button } from "@/components/ui";

export default function DashboardPage() {
  const { wochenplan, reels } = useStore();

  const geplant = wochenplan.length;
  const fertig = wochenplan.filter((w) => w.status === "Produziert" || w.status === "Veröffentlicht").length;
  const offen = wochenplan.filter((w) => w.status === "Idee" || w.status === "Entwurf").length;
  const naechster = wochenplan.find((w) => w.status !== "Veröffentlicht" && w.status !== "Produziert");

  const stats = [
    { label: "Geplante Reels", value: geplant },
    { label: "Fertige Reels", value: fertig },
    { label: "Offene Inhalte", value: offen },
  ];

  return (
    <div>
      <PageHeader
        title="Guten Tag."
        subtitle="Hier ist der Stand deiner Content-Woche für SQT."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="font-display text-4xl text-charcoal">{s.value}</div>
            <div className="text-sm text-taupe mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="lg:col-span-2">
          <div className="text-sm font-medium text-taupe mb-3">Nächster geplanter Beitrag</div>
          {naechster ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-charcoal">{naechster.thema}</div>
                <div className="text-sm text-taupe mt-1">{naechster.tag} · {naechster.ziel}</div>
              </div>
              <StatusPill status={naechster.status} />
            </div>
          ) : (
            <div className="text-sm text-taupe">Alle Beiträge dieser Woche sind veröffentlicht.</div>
          )}
        </Card>

        <Card>
          <div className="text-sm font-medium text-taupe mb-3">Reels in Bearbeitung</div>
          <div className="space-y-2">
            {reels.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{r.thema}</span>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="text-sm font-medium text-taupe mb-3">Schnellzugriffe</div>
        <div className="flex flex-wrap gap-3">
          <Button href="/research" variant="secondary">Research starten</Button>
          <Button href="/content-erstellen" variant="secondary">Content erstellen</Button>
          <Button href="/wochenplan" variant="secondary">Wochenplan öffnen</Button>
          <Button href="/bibliothek" variant="secondary">Content-Bibliothek</Button>
        </div>
      </div>
    </div>
  );
}
