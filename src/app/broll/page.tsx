"use client";

import { useMemo, useState } from "react";
import { IconMuell } from "@/components/icons";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Hinweis,
  PageHeader,
  Tag,
  cx,
  eingabeKlassen,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import type { BrollClip } from "@/lib/types";

/** Farbpalette für die Vorschau-Platzhalter, solange kein Video hinterlegt ist. */
const VORSCHAU_FARBEN = [
  "#f4e7d3",
  "#e3ece9",
  "#e6e8f2",
  "#eef2e6",
  "#f2e9ef",
  "#e7f0f4",
  "#f0ece3",
];

function leererClip(brandId: string, naechsterCode: string): BrollClip {
  return {
    id: `broll-${Date.now().toString(36)}`,
    brandId,
    besitzer: "marke",
    code: naechsterCode,
    titel: "",
    beschreibung: "",
    tags: [],
    kategorie: "Produktaufnahme",
    vorschauFarbe:
      VORSCHAU_FARBEN[Math.floor(Math.random() * VORSCHAU_FARBEN.length)],
    dauerSekunden: 8,
    createdAt: new Date().toISOString(),
  };
}

export default function BrollSeite() {
  const { broll, brollSpeichern, brollLoeschen, markeId, benutzer, wissen } =
    useStore();
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState("alle");
  const [entwurf, setEntwurf] = useState<BrollClip | null>(null);
  const [neu, setNeu] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [loeschAbfrage, setLoeschAbfrage] = useState<string | null>(null);

  const istKunde = benutzer.role !== "admin";

  const kategorien = useMemo(
    () => ["alle", ...Array.from(new Set(broll.map((clip) => clip.kategorie)))],
    [broll],
  );

  /** Nächste freie Kennung im Schema B001, B002 … */
  const naechsterCode = useMemo(() => {
    const nummern = broll
      .map((clip) => Number.parseInt(clip.code.replace(/\D/g, ""), 10))
      .filter((nummer) => !Number.isNaN(nummer));
    const hoechste = nummern.length > 0 ? Math.max(...nummern) : 0;
    return `B${String(hoechste + 1).padStart(3, "0")}`;
  }, [broll]);

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

  function neuAnlegen() {
    const clip = leererClip(markeId, naechsterCode);
    setEntwurf(
      istKunde
        ? { ...clip, besitzer: "kunde", besitzerUserId: benutzer.id }
        : clip,
    );
    setNeu(true);
    setMeldung(null);
  }

  function bearbeiten(clip: BrollClip) {
    setEntwurf({ ...clip });
    setNeu(false);
    setMeldung(null);
  }

  function speichern() {
    if (!entwurf || !entwurf.titel.trim()) return;
    brollSpeichern(entwurf);
    setEntwurf(null);
    setMeldung(neu ? "Clip angelegt." : "Clip gespeichert.");
  }

  function entfernen(id: string) {
    brollLoeschen(id);
    setLoeschAbfrage(null);
    if (entwurf?.id === id) setEntwurf(null);
    setMeldung("Clip gelöscht.");
  }

  return (
    <>
      <PageHeader
        titel="B-Roll-Bibliothek"
        beschreibung="Alle kurzen Videoclips mit Kennung, Beschreibung und Schlagworten. Die Clips werden beim Erstellen automatisch vorgeschlagen und lassen sich jedem Reel einzeln zuordnen."
        aktionen={
          <Button variante="primaer" onClick={neuAnlegen}>
            Clip anlegen
          </Button>
        }
      />

      {meldung && (
        <div className="mb-5">
          <Hinweis>{meldung}</Hinweis>
        </div>
      )}

      {istKunde && (
        <div className="mb-5">
          <Hinweis ton="warnung">
            Du siehst gerade die Kundenansicht. Angelegte Clips gehören dieser
            Kundin und sind für andere nicht sichtbar. Das Hochladen echter
            Videodateien kommt mit der Datenbank-Anbindung.
          </Hinweis>
        </div>
      )}

      {entwurf && (
        <Card className="mb-5">
          <CardHeader
            titel={neu ? "Neuer Clip" : `Clip ${entwurf.code} bearbeiten`}
            beschreibung="Videodatei folgt später – jetzt zählen Beschreibung und Schlagworte, damit der Clip gefunden wird."
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kennung">
                <input
                  value={entwurf.code}
                  onChange={(event) =>
                    setEntwurf({ ...entwurf, code: event.target.value })
                  }
                  className={eingabeKlassen}
                />
              </Field>
              <Field label="Titel">
                <input
                  value={entwurf.titel}
                  onChange={(event) =>
                    setEntwurf({ ...entwurf, titel: event.target.value })
                  }
                  placeholder="z. B. Ampulle in der Hand"
                  className={eingabeKlassen}
                />
              </Field>
            </div>

            <Field label="Beschreibung">
              <textarea
                value={entwurf.beschreibung}
                onChange={(event) =>
                  setEntwurf({ ...entwurf, beschreibung: event.target.value })
                }
                rows={2}
                placeholder="Was ist zu sehen? Kameraführung, Licht, Stimmung."
                className={eingabeKlassen}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Kategorie">
                <input
                  value={entwurf.kategorie}
                  onChange={(event) =>
                    setEntwurf({ ...entwurf, kategorie: event.target.value })
                  }
                  className={eingabeKlassen}
                />
              </Field>
              <Field label="Produkt (optional)">
                <select
                  value={entwurf.produkt ?? ""}
                  onChange={(event) =>
                    setEntwurf({
                      ...entwurf,
                      produkt: event.target.value || undefined,
                    })
                  }
                  className={eingabeKlassen}
                >
                  <option value="">Kein Produkt</option>
                  {wissen?.produkte.map((produkt) => (
                    <option key={produkt.name} value={produkt.name}>
                      {produkt.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dauer in Sekunden">
                <input
                  type="number"
                  min={1}
                  value={entwurf.dauerSekunden}
                  onChange={(event) =>
                    setEntwurf({
                      ...entwurf,
                      dauerSekunden: Number(event.target.value) || 1,
                    })
                  }
                  className={eingabeKlassen}
                />
              </Field>
            </div>

            <Field
              label="Schlagworte"
              hinweis="Mit Komma trennen. Danach wird beim Erstellen gesucht."
            >
              <input
                value={entwurf.tags.join(", ")}
                onChange={(event) =>
                  setEntwurf({
                    ...entwurf,
                    tags: event.target.value
                      .split(",")
                      .map((tag) => tag.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                placeholder="detail, produkt, hook"
                className={eingabeKlassen}
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button
                variante="primaer"
                onClick={speichern}
                disabled={!entwurf.titel.trim()}
              >
                {neu ? "Clip anlegen" : "Änderungen speichern"}
              </Button>
              <Button variante="dezent" onClick={() => setEntwurf(null)}>
                Abbrechen
              </Button>
              {!entwurf.titel.trim() && (
                <span className="self-center text-xs text-slate-500">
                  Ein Titel ist nötig.
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      )}

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
            beschreibung="Passe die Suche oder die Kategorie an – oder lege einen neuen Clip an."
            aktion={<Button onClick={neuAnlegen}>Clip anlegen</Button>}
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
                  {clip.besitzer === "kunde" && (
                    <span className="absolute bottom-3 left-3 rounded-lg bg-marke-700 px-2 py-1 text-xs font-medium text-white">
                      Eigener Clip
                    </span>
                  )}
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
                  <div className="mt-4 flex items-center gap-2">
                    <Button variante="sekundaer" onClick={() => bearbeiten(clip)}>
                      Bearbeiten
                    </Button>
                    {loeschAbfrage === clip.id ? (
                      <>
                        <Button
                          variante="gefahr"
                          onClick={() => entfernen(clip.id)}
                        >
                          Ja, löschen
                        </Button>
                        <Button
                          variante="dezent"
                          onClick={() => setLoeschAbfrage(null)}
                        >
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLoeschAbfrage(clip.id)}
                        className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`${clip.code} löschen`}
                      >
                        <IconMuell className="h-4 w-4" />
                      </button>
                    )}
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
