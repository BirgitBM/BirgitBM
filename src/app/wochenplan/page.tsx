"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, StatusPill, EmptyState, AutoInput, AutoTextarea } from "@/components/ui";
import { ContentStatus, ContentZiel, WochenplanEintrag } from "@/lib/types";
import { WOCHENTAGE, datumInWoche, istHeute, kalenderwocheVon, wocheVerschieben, wochenBeschriftung } from "@/lib/woche";

const statusOptionen: ContentStatus[] = ["Idee", "Entwurf", "Freigegeben", "Produziert", "Veröffentlicht"];
const zielOptionen: ContentZiel[] = [
  "Reichweite",
  "Education",
  "Produktverkauf",
  "Behandlung verkaufen",
  "neue Studios gewinnen",
  "Vertrauen",
  "Einwand beantworten",
];

// Empfohlene Mischung: 2 Education, 1 Produkt, 1 Verkauf, 1 Reichweite.
const beispielMischung: { tag: string; thema: string; ziel: ContentZiel; uhrzeit: string }[] = [
  { tag: "Montag", thema: "Behandlungsmythos aufklären", ziel: "Education", uhrzeit: "11:00" },
  { tag: "Dienstag", thema: "Häufig gestellte Frage beantwortet", ziel: "Education", uhrzeit: "10:00" },
  { tag: "Mittwoch", thema: "Produkt im Detail", ziel: "Produktverkauf", uhrzeit: "17:30" },
  { tag: "Donnerstag", thema: "Warum diese Behandlung wirkt", ziel: "Behandlung verkaufen", uhrzeit: "12:00" },
  { tag: "Freitag", thema: "Ein Blick hinter die Kulissen", ziel: "Reichweite", uhrzeit: "18:00" },
];

export default function WochenplanPage() {
  const {
    wochenplan,
    updateWochenplanEintrag,
    addWochenplanEintrag,
    removeWochenplanEintrag,
    addWochenplanEintraege,
    broll,
  } = useStore();

  const aktuelleWoche = kalenderwocheVon();
  const [woche, setWoche] = useState(aktuelleWoche);

  const eintraege = useMemo(
    () => wochenplan.filter((e) => e.kalenderwoche === woche),
    [wochenplan, woche]
  );

  const neueWoche = () => {
    const neu: WochenplanEintrag[] = beispielMischung.map((b, i) => ({
      id: `W${Date.now()}${i}`,
      kalenderwoche: woche,
      tag: b.tag,
      uhrzeit: b.uhrzeit,
      thema: b.thema,
      ziel: b.ziel,
      status: "Idee",
      brollId: broll[i % Math.max(1, broll.length)]?.id,
    }));
    // Ersetzt nur die angezeigte Woche, andere Wochen bleiben bestehen.
    addWochenplanEintraege([...wochenplan.filter((e) => e.kalenderwoche !== woche), ...neu]);
  };

  const beitragAnlegen = (tag: string) =>
    addWochenplanEintrag({
      id: `W${Date.now()}`,
      kalenderwoche: woche,
      tag,
      uhrzeit: "12:00",
      thema: "Neuer Beitrag",
      ziel: "Education",
      status: "Idee",
    });

  const werktage = WOCHENTAGE.slice(0, 5);
  const sichtbareTage = WOCHENTAGE.slice(5).some((t) => eintraege.some((e) => e.tag === t))
    ? WOCHENTAGE
    : werktage;

  return (
    <div>
      <PageHeader
        title="Wochenplan"
        subtitle="Mischung aus Education, Produkt-, Verkaufs- und Reichweitenreels. Beiträge lassen sich einzeln anlegen, verschieben und entfernen."
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setWoche(wocheVerschieben(woche, -1))}>
              ←
            </Button>
            <span className="min-w-[15rem] text-center text-sm font-medium">
              {wochenBeschriftung(woche)}
            </span>
            <Button variant="secondary" onClick={() => setWoche(wocheVerschieben(woche, 1))}>
              →
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-taupe">
              {eintraege.length} {eintraege.length === 1 ? "Beitrag" : "Beiträge"}
            </span>
            {woche !== aktuelleWoche && (
              <button
                type="button"
                onClick={() => setWoche(aktuelleWoche)}
                className="text-xs text-[var(--amber)] hover:underline"
              >
                Zur aktuellen Woche
              </button>
            )}
            <Button onClick={neueWoche}>5 Reels für diese Woche erstellen</Button>
          </div>
        </div>
      </Card>

      {eintraege.length === 0 ? (
        <EmptyState text="Diese Woche ist noch leer. Erstelle fünf Reels in ausgewogener Mischung oder lege einzelne Beiträge an." />
      ) : (
        <div className="space-y-6">
          {sichtbareTage.map((tag) => {
            const desTages = eintraege.filter((e) => e.tag === tag);
            return (
              <div key={tag}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span
                    className={`text-sm font-medium ${
                      istHeute(woche, tag) ? "text-[var(--amber)]" : "text-charcoal"
                    }`}
                  >
                    {tag}
                    {istHeute(woche, tag) && " (heute)"}
                  </span>
                  <span className="text-xs text-taupe">
                    {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(
                      datumInWoche(woche, tag)
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => beitragAnlegen(tag)}
                    className="ml-auto text-xs text-[var(--amber)] hover:underline"
                  >
                    + Beitrag
                  </button>
                </div>

                {desTages.length === 0 ? (
                  <div className="rounded-md border border-dashed border-line px-4 py-3 text-xs text-taupe">
                    frei
                  </div>
                ) : (
                  <div className="space-y-3">
                    {desTages.map((eintrag) => {
                      const clip = broll.find((b) => b.id === eintrag.brollId);
                      return (
                        <Card key={eintrag.id}>
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-20 shrink-0">
                              <AutoInput
                                wert={eintrag.uhrzeit}
                                onChange={(uhrzeit) => updateWochenplanEintrag(eintrag.id, { uhrzeit })}
                                label={`Uhrzeit ${eintrag.thema}`}
                                placeholder="12:00"
                                textKlassen="px-2 py-1 text-sm text-taupe"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <AutoTextarea
                                wert={eintrag.thema}
                                onChange={(thema) => updateWochenplanEintrag(eintrag.id, { thema })}
                                label="Thema"
                                placeholder="Worum geht es?"
                                textKlassen="px-2 py-1 text-sm font-medium"
                              />
                              {clip && (
                                <div className="text-xs text-taupe mt-1 px-2">
                                  B-Roll: {clip.id} – {clip.titel}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill status={eintrag.status} />
                              <select
                                value={eintrag.ziel}
                                onChange={(e) =>
                                  updateWochenplanEintrag(eintrag.id, {
                                    ziel: e.target.value as ContentZiel,
                                  })
                                }
                                aria-label={`Ziel für ${eintrag.thema}`}
                                className="text-xs rounded-md border border-line bg-white px-2 py-1.5"
                              >
                                {zielOptionen.map((z) => <option key={z}>{z}</option>)}
                              </select>
                              <select
                                value={eintrag.status}
                                onChange={(e) =>
                                  updateWochenplanEintrag(eintrag.id, {
                                    status: e.target.value as ContentStatus,
                                  })
                                }
                                aria-label={`Status für ${eintrag.thema}`}
                                className="text-xs rounded-md border border-line bg-white px-2 py-1.5"
                              >
                                {statusOptionen.map((s) => <option key={s}>{s}</option>)}
                              </select>
                              <select
                                value={eintrag.tag}
                                onChange={(e) => updateWochenplanEintrag(eintrag.id, { tag: e.target.value })}
                                aria-label={`Tag für ${eintrag.thema}`}
                                className="text-xs rounded-md border border-line bg-white px-2 py-1.5"
                              >
                                {WOCHENTAGE.map((t) => (
                                  <option key={t} value={t}>Verschieben auf {t}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeWochenplanEintrag(eintrag.id)}
                                className="px-1.5 py-1 text-xs text-taupe hover:text-[var(--red)]"
                                aria-label={`${eintrag.thema} entfernen`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
