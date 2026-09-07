"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ReelKarte } from "@/components/ReelKarte";
import { Card, PageHeader, StatusPill, EmptyState, Button, Hinweis, inputClass } from "@/components/ui";
import { reelAlsText } from "@/lib/reelText";
import { ContentArt, ContentStatus, Marke, ReelCard, Zielgruppe } from "@/lib/types";

const marken: Marke[] = ["SQT B2B", "SQT Homecare", "Exoprime", "Haut Zentrum"];
const zielgruppen: Zielgruppe[] = ["Kosmetikerinnen", "Endkunden"];
const status: ContentStatus[] = ["Idee", "Entwurf", "Freigegeben", "Produziert", "Veröffentlicht"];
const contentArten: ContentArt[] = ["Reel", "Carousel", "Story", "Single Post"];

export default function BibliothekPage() {
  const {
    reels,
    broll,
    markenwissen,
    rolle,
    updateReel,
    removeReel,
    duplicateReel,
    brollIdsFuer,
    setBrollFuerReel,
  } = useStore();

  const [marke, setMarke] = useState<Marke | "alle">("alle");
  const [zielgruppe, setZielgruppe] = useState<Zielgruppe | "alle">("alle");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "alle">("alle");
  const [artFilter, setArtFilter] = useState<ContentArt | "alle">("alle");
  const [produktFilter, setProduktFilter] = useState("alle");
  const [suche, setSuche] = useState("");
  const [auswahlId, setAuswahlId] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const [loeschAbfrage, setLoeschAbfrage] = useState(false);

  const istAdmin = rolle === "admin";

  // Kundinnen sehen ausschliesslich freigegebene, für Kunden markierte Inhalte.
  const sichtbar = useMemo(
    () =>
      istAdmin
        ? reels
        : reels.filter(
            (r) =>
              r.freigegebenFuerKunden &&
              ["Freigegeben", "Produziert", "Veröffentlicht"].includes(r.status)
          ),
    [reels, istAdmin]
  );

  const produkte = useMemo(
    () => Array.from(new Set(sichtbar.map((r) => r.produkt).filter(Boolean) as string[])).sort(),
    [sichtbar]
  );

  const gefiltert = useMemo(() => {
    return sichtbar.filter((r) => {
      if (marke !== "alle" && r.marke !== marke) return false;
      if (zielgruppe !== "alle" && r.zielgruppe !== zielgruppe) return false;
      if (statusFilter !== "alle" && r.status !== statusFilter) return false;
      if (artFilter !== "alle" && r.contentArt !== artFilter) return false;
      if (produktFilter !== "alle" && r.produkt !== produktFilter) return false;
      if (
        suche.trim() &&
        !`${r.thema} ${r.produkt ?? ""} ${r.hook} ${r.caption}`
          .toLowerCase()
          .includes(suche.toLowerCase())
      )
        return false;
      return true;
    });
  }, [sichtbar, marke, zielgruppe, statusFilter, artFilter, produktFilter, suche]);

  const ausgewaehlt = gefiltert.find((r) => r.id === auswahlId) ?? null;
  const warnWoerter =
    markenwissen.find((m) => m.marke === ausgewaehlt?.marke)?.woerterVermeiden ?? [];

  const auswaehlen = (id: string) => {
    setAuswahlId(id === auswahlId ? null : id);
    setLoeschAbfrage(false);
  };

  const kopieren = async (reel: ReelCard) => {
    const clips = broll.filter((c) => brollIdsFuer(reel).includes(c.id));
    try {
      await navigator.clipboard.writeText(reelAlsText(reel, clips));
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2000);
    } catch {
      setKopiert(false);
    }
  };

  const select = "text-sm rounded-md border border-line bg-white px-3 py-2";

  return (
    <div>
      <PageHeader
        title="Content-Bibliothek"
        subtitle="Alle Inhalte an einem Ort – filterbar nach Marke, Produkt, Zielgruppe, Content-Art und Status."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
          <select className={select} value={marke} onChange={(e) => setMarke(e.target.value as Marke | "alle")}>
            <option value="alle">Alle Marken</option>
            {marken.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className={select} value={produktFilter} onChange={(e) => setProduktFilter(e.target.value)}>
            <option value="alle">Alle Produkte</option>
            {produkte.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className={select} value={zielgruppe} onChange={(e) => setZielgruppe(e.target.value as Zielgruppe | "alle")}>
            <option value="alle">Alle Zielgruppen</option>
            {zielgruppen.map((z) => <option key={z}>{z}</option>)}
          </select>
          <select className={select} value={artFilter} onChange={(e) => setArtFilter(e.target.value as ContentArt | "alle")}>
            <option value="alle">Alle Content-Arten</option>
            {contentArten.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select className={select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContentStatus | "alle")}>
            <option value="alle">Alle Status</option>
            {status.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <input
          className={inputClass}
          placeholder="Suche in Thema, Hook, Caption und Produkt …"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        <p className="text-xs text-taupe mt-3">
          {gefiltert.length} von {sichtbar.length} Inhalten
          {!istAdmin && " · Kundenansicht: nur freigegebene Inhalte"}
        </p>
      </Card>

      {gefiltert.length === 0 ? (
        <EmptyState text="Keine Inhalte gefunden. Passe die Filter an oder erstelle neuen Content." />
      ) : (
        <div className="space-y-3">
          {gefiltert.map((r) => (
            <div key={r.id}>
              <Card
                className={`cursor-pointer transition-colors hover:bg-ivory ${
                  auswahlId === r.id ? "border-gold" : ""
                }`}
              >
                <div
                  onClick={() => auswaehlen(r.id)}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{r.thema}</div>
                    <div className="text-sm text-taupe mt-0.5">
                      {r.marke} · {r.zielgruppe} · {r.ziel}
                      {r.produkt ? ` · ${r.produkt}` : ""}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              </Card>

              {auswahlId === r.id && ausgewaehlt && (
                <div className="mt-3 space-y-3">
                  {kopiert && <Hinweis>Der vollständige Text liegt in der Zwischenablage.</Hinweis>}
                  <ReelKarte
                    reel={ausgewaehlt}
                    broll={broll}
                    brollIds={brollIdsFuer(ausgewaehlt)}
                    warnWoerter={warnWoerter}
                    onChange={istAdmin ? (patch) => updateReel(ausgewaehlt.id, patch) : undefined}
                    onBrollChange={(brollIds) => setBrollFuerReel(ausgewaehlt, brollIds)}
                    onStatusChange={
                      istAdmin
                        ? (neuerStatus) =>
                            updateReel(ausgewaehlt.id, {
                              status: neuerStatus,
                              freigegebenFuerKunden:
                                ["Freigegeben", "Produziert", "Veröffentlicht"].includes(neuerStatus)
                                  ? true
                                  : ausgewaehlt.freigegebenFuerKunden,
                            })
                        : undefined
                    }
                    aktionen={
                      <>
                        <Button variant="secondary" onClick={() => kopieren(ausgewaehlt)}>
                          {kopiert ? "Kopiert" : "Alles kopieren"}
                        </Button>
                        {istAdmin && (
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              const kopie = await duplicateReel(ausgewaehlt);
                              setAuswahlId(kopie.id);
                            }}
                          >
                            Duplizieren
                          </Button>
                        )}
                        {!istAdmin && (
                          <>
                            <Button variant="secondary" disabled>Video herunterladen</Button>
                            <Button variant="secondary" disabled>Story herunterladen</Button>
                          </>
                        )}
                        {istAdmin &&
                          (loeschAbfrage ? (
                            <span className="inline-flex items-center gap-2 text-xs text-taupe">
                              Wirklich löschen?
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  removeReel(ausgewaehlt.id);
                                  setAuswahlId(null);
                                  setLoeschAbfrage(false);
                                }}
                              >
                                Ja, löschen
                              </Button>
                              <Button variant="ghost" onClick={() => setLoeschAbfrage(false)}>
                                Abbrechen
                              </Button>
                            </span>
                          ) : (
                            <Button variant="ghost" onClick={() => setLoeschAbfrage(true)}>
                              Löschen
                            </Button>
                          ))}
                      </>
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
