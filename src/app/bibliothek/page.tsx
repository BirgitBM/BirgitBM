"use client";

import { useMemo, useState } from "react";
import { IconKopieren } from "@/components/icons";
import { ReelKarte } from "@/components/reel-card";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  StatusBadge,
  cx,
  eingabeKlassen,
} from "@/components/ui";
import {
  AUDIENCE_LABELS,
  FORMAT_LABELS,
  GOAL_LABELS,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
  formatDatum,
} from "@/lib/labels";
import { contentAlsText } from "@/lib/export";
import { useStore } from "@/lib/store";
import type { ContentItem, ContentStatus } from "@/lib/types";

const ALLE = "alle";

export default function BibliothekSeite() {
  const {
    contentAlleMarken,
    broll,
    marken,
    wissen,
    rechte,
    contentSpeichern,
    contentLoeschen,
    brollIdsFuer,
    brollZuordnen,
    benutzer,
  } = useStore();

  const [suche, setSuche] = useState("");
  const [marke, setMarke] = useState(ALLE);
  const [produkt, setProdukt] = useState(ALLE);
  const [zielgruppe, setZielgruppe] = useState(ALLE);
  const [art, setArt] = useState(ALLE);
  const [status, setStatus] = useState(ALLE);
  const [ausgewaehlt, setAusgewaehlt] = useState<ContentItem | null>(null);
  const [ungespeichert, setUngespeichert] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [loeschAbfrage, setLoeschAbfrage] = useState(false);

  /** Wechsel der Auswahl verwirft nichts still: erst speichern, dann wechseln. */
  function auswaehlen(item: ContentItem) {
    setAusgewaehlt(item);
    setUngespeichert(false);
    setLoeschAbfrage(false);
  }

  /** Legt eine Kopie an – nützlich, um dasselbe Thema für die andere
      Zielgruppe oder eine weitere Marke zu variieren. */
  function duplizieren(item: ContentItem) {
    const jetzt = new Date().toISOString();
    const kopie: ContentItem = {
      ...item,
      id: `content-${Date.now().toString(36)}`,
      thema: `${item.thema} (Kopie)`,
      status: "entwurf",
      visibility: "intern",
      createdAt: jetzt,
      updatedAt: jetzt,
    };
    contentSpeichern(kopie);
    setAusgewaehlt(kopie);
    setUngespeichert(false);
  }

  function loeschen(item: ContentItem) {
    contentLoeschen(item.id);
    setAusgewaehlt(null);
    setUngespeichert(false);
    setLoeschAbfrage(false);
  }

  async function allesKopieren(item: ContentItem) {
    const clips = broll.filter((clip) => brollIdsFuer(item).includes(clip.id));
    try {
      await navigator.clipboard.writeText(contentAlsText(item, clips));
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2000);
    } catch {
      setKopiert(false);
    }
  }

  const produkte = useMemo(() => {
    const ausInhalten = contentAlleMarken
      .map((eintrag) => eintrag.produkt)
      .filter((wert): wert is string => Boolean(wert));
    const ausWissen = wissen?.produkte.map((eintrag) => eintrag.name) ?? [];
    return Array.from(new Set([...ausWissen, ...ausInhalten])).sort();
  }, [contentAlleMarken, wissen]);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return contentAlleMarken
      .filter((eintrag) => {
        if (marke !== ALLE && eintrag.brandId !== marke) return false;
        if (produkt !== ALLE && eintrag.produkt !== produkt) return false;
        if (zielgruppe !== ALLE && eintrag.audience !== zielgruppe) return false;
        if (art !== ALLE && eintrag.format !== art) return false;
        if (status !== ALLE && eintrag.status !== status) return false;
        if (!begriff) return true;
        return (
          eintrag.thema.toLowerCase().includes(begriff) ||
          eintrag.hook.toLowerCase().includes(begriff) ||
          eintrag.caption.toLowerCase().includes(begriff) ||
          (eintrag.produkt?.toLowerCase().includes(begriff) ?? false)
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [contentAlleMarken, suche, marke, produkt, zielgruppe, art, status]);

  function zuruecksetzen() {
    setSuche("");
    setMarke(ALLE);
    setProdukt(ALLE);
    setZielgruppe(ALLE);
    setArt(ALLE);
    setStatus(ALLE);
  }

  const filterAktiv =
    suche !== "" ||
    [marke, produkt, zielgruppe, art, status].some((wert) => wert !== ALLE);

  return (
    <>
      <PageHeader
        titel="Content-Bibliothek"
        beschreibung="Alle erstellten Inhalte an einem Ort – filterbar nach Marke, Produkt, Zielgruppe, Content-Art und Status."
      />

      <Card>
        <CardBody className="space-y-3">
          <input
            value={suche}
            onChange={(event) => setSuche(event.target.value)}
            placeholder="Suche in Thema, Hook und Caption …"
            className={eingabeKlassen}
            aria-label="Inhalte durchsuchen"
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <select
              value={marke}
              onChange={(event) => setMarke(event.target.value)}
              className={eingabeKlassen}
              aria-label="Nach Marke filtern"
            >
              <option value={ALLE}>Alle Marken</option>
              {marken.map((eintrag) => (
                <option key={eintrag.id} value={eintrag.id}>
                  {eintrag.name}
                </option>
              ))}
            </select>
            <select
              value={produkt}
              onChange={(event) => setProdukt(event.target.value)}
              className={eingabeKlassen}
              aria-label="Nach Produkt filtern"
            >
              <option value={ALLE}>Alle Produkte</option>
              {produkte.map((eintrag) => (
                <option key={eintrag} value={eintrag}>
                  {eintrag}
                </option>
              ))}
            </select>
            <select
              value={zielgruppe}
              onChange={(event) => setZielgruppe(event.target.value)}
              className={eingabeKlassen}
              aria-label="Nach Zielgruppe filtern"
            >
              <option value={ALLE}>Alle Zielgruppen</option>
              {Object.entries(AUDIENCE_LABELS).map(([wert, label]) => (
                <option key={wert} value={wert}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={art}
              onChange={(event) => setArt(event.target.value)}
              className={eingabeKlassen}
              aria-label="Nach Content-Art filtern"
            >
              <option value={ALLE}>Alle Content-Arten</option>
              {Object.entries(FORMAT_LABELS).map(([wert, label]) => (
                <option key={wert} value={wert}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={eingabeKlassen}
              aria-label="Nach Status filtern"
            >
              <option value={ALLE}>Alle Status</option>
              {STATUS_REIHENFOLGE.map((wert) => (
                <option key={wert} value={wert}>
                  {STATUS_LABELS[wert]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {gefiltert.length} von {contentAlleMarken.length} Inhalten
            </p>
            {filterAktiv && (
              <button
                type="button"
                onClick={zuruecksetzen}
                className="text-xs font-medium text-marke-700 hover:text-marke-800"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="mt-5">
        {gefiltert.length === 0 ? (
          <EmptyState
            titel="Keine Inhalte gefunden"
            beschreibung="Mit den aktuellen Filtern gibt es kein Ergebnis. Setze die Filter zurück oder erstelle ein neues Reel."
          />
        ) : (
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">Thema</th>
                      <th className="px-5 py-3 font-medium">Marke</th>
                      <th className="px-5 py-3 font-medium">Ziel</th>
                      <th className="px-5 py-3 font-medium">Zielgruppe</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Geändert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gefiltert.map((eintrag) => (
                      <tr
                        key={eintrag.id}
                        onClick={() => auswaehlen(eintrag)}
                        className={cx(
                          "cursor-pointer transition hover:bg-slate-50",
                          ausgewaehlt?.id === eintrag.id && "bg-marke-50/50",
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">
                            {eintrag.thema}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {eintrag.hook}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {marken.find((element) => element.id === eintrag.brandId)
                            ?.name ?? eintrag.brandId}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {GOAL_LABELS[eintrag.goal]}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {AUDIENCE_LABELS[eintrag.audience]}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={eintrag.status} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDatum(eintrag.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {ausgewaehlt && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Vorschau</h2>
            <button
              type="button"
              onClick={() => {
                setAusgewaehlt(null);
                setUngespeichert(false);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Vorschau schließen
            </button>
          </div>
          <ReelKarte
            item={ausgewaehlt}
            broll={broll}
            warnWoerter={wissen?.woerterVermeiden ?? []}
            brollIds={brollIdsFuer(ausgewaehlt)}
            onBrollChange={(brollIds) => {
              brollZuordnen(ausgewaehlt, brollIds);
              setAusgewaehlt(
                rechte.darfInhalteErstellen
                  ? { ...ausgewaehlt, brollIds }
                  : ausgewaehlt,
              );
            }}
            onStatusChange={
              rechte.darfFreigeben
                ? (status: ContentStatus) => {
                    const aktualisiert: ContentItem = {
                      ...ausgewaehlt,
                      status,
                      visibility:
                        status === "freigegeben" ||
                        status === "produziert" ||
                        status === "veroeffentlicht"
                          ? "kunde"
                          : ausgewaehlt.visibility,
                      updatedAt: new Date().toISOString(),
                    };
                    contentSpeichern(aktualisiert);
                    setAusgewaehlt(aktualisiert);
                  }
                : undefined
            }
            onChange={
              rechte.darfInhalteErstellen
                ? (neu) => {
                    setAusgewaehlt(neu);
                    setUngespeichert(true);
                  }
                : undefined
            }
            aktionen={
              <>
                {rechte.darfInhalteErstellen && (
                  <Button
                    variante="primaer"
                    disabled={!ungespeichert}
                    onClick={() => {
                      contentSpeichern(ausgewaehlt);
                      setUngespeichert(false);
                    }}
                  >
                    Änderungen speichern
                  </Button>
                )}
                {rechte.darfCaptionKopieren && (
                  <Button onClick={() => allesKopieren(ausgewaehlt)}>
                    <IconKopieren className="h-4 w-4" />
                    {kopiert ? "Kopiert" : "Alles kopieren"}
                  </Button>
                )}
                {rechte.darfInhalteErstellen && (
                  <Button onClick={() => duplizieren(ausgewaehlt)}>
                    Duplizieren
                  </Button>
                )}
                {/* Nur in der Kundenansicht: zeigt, was der spätere Zugang
                    können wird. In der Admin-Ansicht wäre es nur Ballast. */}
                {benutzer.role !== "admin" && rechte.darfVideoHerunterladen && (
                  <Button
                    variante="dezent"
                    disabled
                    title="Kommt mit der Datenbank-Anbindung"
                  >
                    Video herunterladen
                  </Button>
                )}
                {benutzer.role !== "admin" && rechte.darfStoryHerunterladen && (
                  <Button
                    variante="dezent"
                    disabled
                    title="Kommt mit der Datenbank-Anbindung"
                  >
                    Story herunterladen
                  </Button>
                )}
                {rechte.darfFreigeben && ausgewaehlt.status !== "freigegeben" && (
                  <Button
                    onClick={() => {
                      const aktualisiert: ContentItem = {
                        ...ausgewaehlt,
                        status: "freigegeben",
                        visibility: "kunde",
                        updatedAt: new Date().toISOString(),
                      };
                      contentSpeichern(aktualisiert);
                      setAusgewaehlt(aktualisiert);
                      setUngespeichert(false);
                    }}
                  >
                    Freigeben
                  </Button>
                )}
                {rechte.darfInhalteErstellen &&
                  (loeschAbfrage ? (
                    <span className="inline-flex items-center gap-2 text-xs text-slate-700">
                      Wirklich löschen?
                      <Button
                        variante="gefahr"
                        onClick={() => loeschen(ausgewaehlt)}
                      >
                        Ja, löschen
                      </Button>
                      <Button
                        variante="dezent"
                        onClick={() => setLoeschAbfrage(false)}
                      >
                        Abbrechen
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variante="gefahr"
                      onClick={() => setLoeschAbfrage(true)}
                    >
                      Löschen
                    </Button>
                  ))}
                {ungespeichert && (
                  <span className="ml-auto text-xs font-medium text-amber-700">
                    Nicht gespeicherte Änderungen
                  </span>
                )}
              </>
            }
          />
        </div>
      )}
    </>
  );
}
