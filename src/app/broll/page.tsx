"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Tag,
  cx,
  eingabeKlassen,
} from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BrollSeite() {
  const { broll } = useStore();
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState("alle");

  const kategorien = useMemo(
    () => ["alle", ...Array.from(new Set(broll.map((clip) => clip.kategorie)))],
    [broll],
  );

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return broll.filter((clip) => {
      const passtKategorie =
        kategorie === "alle" || clip.kategorie === kategorie;
      if (!passtKategorie) return false;
      if (!begriff) return true;
      return (
        clip.code.toLowerCase().includes(begriff) ||
        clip.titel.toLowerCase().includes(begriff) ||
        clip.beschreibung.toLowerCase().includes(begriff) ||
        clip.tags.some((tag) => tag.includes(begriff)) ||
        (clip.produkt?.toLowerCase().includes(begriff) ?? false)
      );
    });
  }, [broll, suche, kategorie]);

  return (
    <>
      <PageHeader
        titel="B-Roll-Bibliothek"
        beschreibung="Alle kurzen Videoclips mit Kennung, Beschreibung und Schlagworten. Die Clips werden beim Erstellen automatisch vorgeschlagen."
      />

      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Suche nach Kennung, Titel, Produkt oder Tag …"
              className={eingabeKlassen}
              aria-label="B-Roll durchsuchen"
            />
            <select
              value={kategorie}
              onChange={(event) => setKategorie(event.target.value)}
              className={cx(eingabeKlassen, "sm:w-56")}
              aria-label="Kategorie filtern"
            >
              {kategorien.map((eintrag) => (
                <option key={eintrag} value={eintrag}>
                  {eintrag === "alle" ? "Alle Kategorien" : eintrag}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {gefiltert.length} von {broll.length} Clips
          </p>
        </CardBody>
      </Card>

      <div className="mt-5">
        {gefiltert.length === 0 ? (
          <EmptyState
            titel="Kein Clip gefunden"
            beschreibung="Passe die Suche oder die Kategorie an. Neue Clips werden später über den Upload ergänzt."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gefiltert.map((clip) => (
              <Card key={clip.id} className="overflow-hidden">
                {/* Vorschau-Platzhalter, solange keine Videodatei hinterlegt ist */}
                <div
                  className="relative flex aspect-video items-center justify-center"
                  style={{ backgroundColor: clip.vorschauFarbe }}
                >
                  <span className="absolute left-3 top-3 rounded-lg bg-white/85 px-2 py-1 text-xs font-semibold text-slate-800">
                    {clip.code}
                  </span>
                  <span className="absolute right-3 top-3 rounded-lg bg-slate-900/70 px-2 py-1 text-xs font-medium text-white">
                    {clip.dauerSekunden}s
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-10 w-10 text-slate-700/40"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {clip.titel}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {clip.beschreibung}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <Tag>{clip.kategorie}</Tag>
                    {clip.produkt && <Tag>{clip.produkt}</Tag>}
                    {clip.tags.map((tag) => (
                      <Tag key={tag}>#{tag}</Tag>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
