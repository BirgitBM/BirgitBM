"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, StatusPill, EmptyState, inputClass } from "@/components/ui";
import { ContentStatus, ContentZiel, Marke, Zielgruppe } from "@/lib/types";

const marken: Marke[] = ["SQT B2B", "SQT Homecare", "Exoprime", "Haut Zentrum"];
const zielgruppen: Zielgruppe[] = ["Kosmetikerinnen", "Endkunden"];
const status: ContentStatus[] = ["Idee", "Entwurf", "Freigegeben", "Produziert", "Veröffentlicht"];

export default function BibliothekPage() {
  const { reels } = useStore();
  const [marke, setMarke] = useState<Marke | "alle">("alle");
  const [zielgruppe, setZielgruppe] = useState<Zielgruppe | "alle">("alle");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "alle">("alle");
  const [suche, setSuche] = useState("");

  const gefiltert = useMemo(() => {
    return reels.filter((r) => {
      if (marke !== "alle" && r.marke !== marke) return false;
      if (zielgruppe !== "alle" && r.zielgruppe !== zielgruppe) return false;
      if (statusFilter !== "alle" && r.status !== statusFilter) return false;
      if (suche.trim() && !`${r.thema} ${r.produkt ?? ""}`.toLowerCase().includes(suche.toLowerCase())) return false;
      return true;
    });
  }, [reels, marke, zielgruppe, statusFilter, suche]);

  const select = "text-sm rounded-md border border-line bg-white px-3 py-2";

  return (
    <div>
      <PageHeader
        title="Content-Bibliothek"
        subtitle="Alle erstellten Inhalte an einem Ort – filterbar nach Marke, Zielgruppe und Status."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <select className={select} value={marke} onChange={(e) => setMarke(e.target.value as Marke | "alle")}>
            <option value="alle">Alle Marken</option>
            {marken.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className={select} value={zielgruppe} onChange={(e) => setZielgruppe(e.target.value as Zielgruppe | "alle")}>
            <option value="alle">Alle Zielgruppen</option>
            {zielgruppen.map((z) => <option key={z}>{z}</option>)}
          </select>
          <select className={select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContentStatus | "alle")}>
            <option value="alle">Alle Status</option>
            {status.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <input
          className={inputClass}
          placeholder="Suche nach Thema oder Produkt …"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
      </Card>

      {gefiltert.length === 0 ? (
        <EmptyState text="Keine Inhalte gefunden. Passe die Filter an oder erstelle neuen Content." />
      ) : (
        <div className="space-y-3">
          {gefiltert.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <div className="font-medium">{r.thema}</div>
                  <div className="text-sm text-taupe mt-0.5">
                    {r.marke} · {r.zielgruppe} · {r.ziel}{r.produkt ? ` · ${r.produkt}` : ""}
                  </div>
                </div>
                <StatusPill status={r.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
