"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, Field, inputClass, EmptyState, Hinweis } from "@/components/ui";
import { BRollClip } from "@/lib/types";
import { istSichererVideoLink, sichererVideoLink, videoDienst } from "@/lib/videoLink";

const vorschauFarben = ["#f4e7d3", "#e3ece9", "#e6e8f2", "#eef2e6", "#f2e9ef", "#e7f0f4", "#f0ece3"];

export default function BRollPage() {
  const { broll, saveBroll, removeBroll, markenwissen, rolle } = useStore();
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState("alle");
  const [entwurf, setEntwurf] = useState<BRollClip | null>(null);
  const [neu, setNeu] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [loeschAbfrage, setLoeschAbfrage] = useState<string | null>(null);

  const istKunde = rolle !== "admin";
  const produkte = markenwissen.flatMap((m) => m.produkte);

  const kategorien = useMemo(
    () => ["alle", ...Array.from(new Set(broll.map((c) => c.kategorie)))],
    [broll]
  );

  // Nächste freie Kennung im Schema B001, B002 …
  const naechsteId = useMemo(() => {
    const nummern = broll
      .map((c) => Number.parseInt(c.id.replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n));
    return `B${String((nummern.length ? Math.max(...nummern) : 0) + 1).padStart(3, "0")}`;
  }, [broll]);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return broll.filter((c) => {
      if (kategorie !== "alle" && c.kategorie !== kategorie) return false;
      if (!begriff) return true;
      return (
        c.id.toLowerCase().includes(begriff) ||
        c.titel.toLowerCase().includes(begriff) ||
        c.beschreibung.toLowerCase().includes(begriff) ||
        c.tags.some((t) => t.toLowerCase().includes(begriff)) ||
        (c.produkt?.toLowerCase().includes(begriff) ?? false)
      );
    });
  }, [broll, suche, kategorie]);

  const neuAnlegen = () => {
    setEntwurf({
      id: naechsteId,
      titel: "",
      beschreibung: "",
      tags: [],
      kategorie: "Produktaufnahme",
      besitzer: istKunde ? "kunde" : "marke",
      dauerSekunden: 8,
      vorschauFarbe: vorschauFarben[Math.floor(Math.random() * vorschauFarben.length)],
      videoQuelle: "link",
    });
    setNeu(true);
    setMeldung(null);
  };

  const linkUngueltig = Boolean(entwurf?.videoUrl && !istSichererVideoLink(entwurf.videoUrl));

  const speichern = async () => {
    if (!entwurf?.titel.trim() || linkUngueltig) return;
    await saveBroll(entwurf);
    setEntwurf(null);
    setMeldung(neu ? "Clip angelegt." : "Clip gespeichert.");
  };

  return (
    <div>
      <PageHeader
        title="B-Roll-Bibliothek"
        subtitle="Kurze Videoclips, die Reels und dem Wochenplan zugeordnet werden können. Clips lassen sich hier anlegen, bearbeiten und löschen."
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button onClick={neuAnlegen}>Clip anlegen</Button>
        <input
          className={`${inputClass} max-w-md`}
          placeholder="Suche nach Kennung, Titel, Produkt oder Tag …"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          aria-label="B-Roll durchsuchen"
        />
        <select
          className="text-sm rounded-md border border-line bg-white px-3 py-2"
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value)}
          aria-label="Kategorie filtern"
        >
          {kategorien.map((k) => (
            <option key={k} value={k}>{k === "alle" ? "Alle Kategorien" : k}</option>
          ))}
        </select>
        <span className="text-xs text-taupe">{gefiltert.length} von {broll.length} Clips</span>
      </div>

      {meldung && <div className="mb-6"><Hinweis>{meldung}</Hinweis></div>}

      {istKunde && (
        <div className="mb-6">
          <Hinweis ton="warnung">
            Kundenansicht: Angelegte Clips gehören dieser Kundin und sind für andere
            nicht sichtbar. Das Hochladen echter Videodateien braucht Supabase Storage
            und ist noch nicht gebaut.
          </Hinweis>
        </div>
      )}

      {entwurf && (
        <Card className="mb-6">
          <div className="font-display text-xl mb-4">
            {neu ? "Neuer Clip" : `Clip ${entwurf.id} bearbeiten`}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kennung">
              <input
                className={inputClass}
                value={entwurf.id}
                onChange={(e) => setEntwurf({ ...entwurf, id: e.target.value })}
                disabled={!neu}
              />
            </Field>
            <Field label="Titel">
              <input
                className={inputClass}
                value={entwurf.titel}
                onChange={(e) => setEntwurf({ ...entwurf, titel: e.target.value })}
                placeholder="z.B. Ampulle in der Hand"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Beschreibung">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={entwurf.beschreibung}
                  onChange={(e) => setEntwurf({ ...entwurf, beschreibung: e.target.value })}
                  placeholder="Was ist zu sehen? Kameraführung, Licht, Stimmung."
                />
              </Field>
            </div>
            <Field label="Kategorie">
              <input
                className={inputClass}
                value={entwurf.kategorie}
                onChange={(e) => setEntwurf({ ...entwurf, kategorie: e.target.value })}
              />
            </Field>
            <Field label="Produkt (optional)">
              <select
                className={inputClass}
                value={entwurf.produkt ?? ""}
                onChange={(e) => setEntwurf({ ...entwurf, produkt: e.target.value || undefined })}
              >
                <option value="">Kein Produkt</option>
                {produkte.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Dauer in Sekunden">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={entwurf.dauerSekunden}
                onChange={(e) =>
                  setEntwurf({ ...entwurf, dauerSekunden: Number(e.target.value) || 1 })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Video-Link (optional)">
                <input
                  className={inputClass}
                  value={entwurf.videoUrl ?? ""}
                  onChange={(e) =>
                    setEntwurf({ ...entwurf, videoUrl: e.target.value || undefined })
                  }
                  placeholder="https://drive.google.com/… oder Dropbox, WeTransfer, Vimeo …"
                />
              </Field>
              <p className="text-xs text-taupe mt-1.5">
                Die Datei bleibt bei deinem Cloud-Dienst, hier merken wir uns nur die
                Adresse. Achte darauf, dass der Link für die Personen freigegeben ist,
                die ihn öffnen sollen. Das Hochladen direkt ins Dashboard kommt später.
              </p>
              {entwurf.videoUrl && !istSichererVideoLink(entwurf.videoUrl) && (
                <p className="text-xs text-[var(--red)] mt-1.5">
                  Das ist keine gültige Web-Adresse. Sie muss mit http:// oder https://
                  beginnen.
                </p>
              )}
            </div>

            <Field label="Schlagworte (mit Komma trennen)">
              <input
                className={inputClass}
                value={entwurf.tags.join(", ")}
                onChange={(e) =>
                  setEntwurf({
                    ...entwurf,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="Detail, Produkt, Hook"
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button onClick={speichern} disabled={!entwurf.titel.trim() || linkUngueltig}>
              {neu ? "Clip anlegen" : "Änderungen speichern"}
            </Button>
            <Button variant="ghost" onClick={() => setEntwurf(null)}>Abbrechen</Button>
            {!entwurf.titel.trim() && (
              <span className="self-center text-xs text-taupe">Ein Titel ist nötig.</span>
            )}
          </div>
        </Card>
      )}

      {gefiltert.length === 0 ? (
        <EmptyState text="Kein Clip gefunden. Passe die Suche an oder lege einen neuen Clip an." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gefiltert.map((clip) => (
            <Card key={clip.id} className="p-0 overflow-hidden">
              {/* Vorschau-Platzhalter, solange keine Videodatei hinterlegt ist */}
              <div
                className="aspect-video flex items-center justify-center relative"
                style={{ backgroundColor: clip.vorschauFarbe }}
              >
                <span className="absolute left-3 top-3 rounded bg-white/85 px-2 py-1 text-xs font-mono">
                  {clip.id}
                </span>
                <span className="absolute right-3 top-3 rounded bg-charcoal/70 px-2 py-1 text-xs text-ivory">
                  {clip.dauerSekunden}s
                </span>
                {clip.besitzer === "kunde" && (
                  <span className="absolute bottom-3 left-3 rounded bg-gold px-2 py-1 text-xs text-charcoal">
                    Eigener Clip
                  </span>
                )}
                {sichererVideoLink(clip.videoUrl) ? (
                  <a
                    href={sichererVideoLink(clip.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-md bg-white/85 px-3 py-2 text-xs font-medium text-charcoal hover:bg-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                    Video öffnen
                  </a>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-charcoal/25" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{clip.titel}</span>
                  <span className="text-xs text-taupe">{clip.kategorie}</span>
                </div>
                <p className="text-sm text-taupe mt-1">{clip.beschreibung}</p>
                {clip.produkt && <div className="text-xs text-taupe mt-2">Produkt: {clip.produkt}</div>}
                {sichererVideoLink(clip.videoUrl) ? (
                  <div className="text-xs text-taupe mt-2">
                    Video bei {videoDienst(clip.videoUrl)}
                  </div>
                ) : (
                  <div className="text-xs text-taupe mt-2">Noch keine Videodatei hinterlegt</div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {clip.tags.map((t) => (
                    <span key={t} className="text-xs bg-ivory border border-line rounded-full px-2 py-0.5 text-taupe">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEntwurf({ ...clip });
                      setNeu(false);
                      setMeldung(null);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  {loeschAbfrage === clip.id ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          removeBroll(clip.id);
                          setLoeschAbfrage(null);
                          setMeldung("Clip gelöscht.");
                        }}
                      >
                        Ja, löschen
                      </Button>
                      <Button variant="ghost" onClick={() => setLoeschAbfrage(null)}>Abbrechen</Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => setLoeschAbfrage(clip.id)}>Löschen</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
