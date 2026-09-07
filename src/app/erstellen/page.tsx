"use client";

import { useState } from "react";
import { ReelKarte } from "@/components/reel-card";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Hinweis,
  PageHeader,
  eingabeKlassen,
} from "@/components/ui";
import {
  captionErzeugen,
  hookErzeugen,
  reelErzeugen,
  type GeneratorEingabe,
} from "@/lib/generator";
import {
  AUDIENCE_LABELS,
  GOAL_LABELS,
  GOAL_REIHENFOLGE,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Audience, ContentGoal, ContentItem } from "@/lib/types";

export default function ErstellenSeite() {
  const { markeId, marken, broll, wissen, hooks, contentSpeichern, rechte } =
    useStore();

  const [audience, setAudience] = useState<Audience>("kosmetikerinnen");
  const [goal, setGoal] = useState<ContentGoal>("education");
  const [thema, setThema] = useState("");
  const [produkt, setProdukt] = useState("");

  const [entwurf, setEntwurf] = useState<ContentItem | null>(null);
  const [hookVariante, setHookVariante] = useState(0);
  const [captionVariante, setCaptionVariante] = useState(0);
  const [meldung, setMeldung] = useState<string | null>(null);
  /** true, sobald der Entwurf seit dem letzten Speichern verändert wurde. */
  const [ungespeichert, setUngespeichert] = useState(false);

  const eingabe: GeneratorEingabe = {
    brandId: markeId,
    audience,
    goal,
    thema,
    produkt: produkt || undefined,
  };

  function erstellen() {
    if (!thema.trim()) return;
    setEntwurf(reelErzeugen(eingabe, "user-admin"));
    setHookVariante(0);
    setCaptionVariante(0);
    setMeldung(null);
    setUngespeichert(true);
  }

  /** Übernimmt eine Änderung, die direkt in der Karte getippt wurde. */
  function entwurfAendern(neu: ContentItem) {
    setEntwurf(neu);
    setUngespeichert(true);
    setMeldung(null);
  }

  function hookAendern() {
    if (!entwurf) return;
    const naechste = hookVariante + 1;
    const neuerHook = hookErzeugen(eingabe, naechste);
    setHookVariante(naechste);
    setUngespeichert(true);
    setEntwurf({
      ...entwurf,
      hook: neuerHook,
      overlays: entwurf.overlays.map((overlay, index) =>
        index === 0 ? { ...overlay, text: neuerHook } : overlay,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function captionNeu() {
    if (!entwurf) return;
    const naechste = captionVariante + 1;
    setCaptionVariante(naechste);
    setUngespeichert(true);
    setEntwurf({
      ...entwurf,
      caption: captionErzeugen(eingabe, naechste),
      updatedAt: new Date().toISOString(),
    });
  }

  function freigeben() {
    if (!entwurf) return;
    const freigegeben: ContentItem = {
      ...entwurf,
      status: "freigegeben",
      visibility: "kunde",
      updatedAt: new Date().toISOString(),
    };
    setEntwurf(freigegeben);
    contentSpeichern(freigegeben);
    setUngespeichert(false);
    setMeldung(
      "Freigegeben und gespeichert. Der Inhalt ist damit auch für spätere Kundenzugänge sichtbar.",
    );
  }

  function speichern() {
    if (!entwurf) return;
    const gespeichert = { ...entwurf, updatedAt: new Date().toISOString() };
    setEntwurf(gespeichert);
    contentSpeichern(gespeichert);
    setUngespeichert(false);
    setMeldung("In der Content-Bibliothek gespeichert.");
  }

  const markenname =
    marken.find((marke) => marke.id === markeId)?.name ?? "Marke";

  return (
    <>
      <PageHeader
        titel="Content erstellen"
        beschreibung="Aus Marke, Zielgruppe, Ziel und Thema entsteht eine vollständige Reel-Karte – inklusive Hook, B-Roll, Overlays und Caption."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              titel="Vorgaben"
              beschreibung={`Aktive Marke: ${markenname}`}
            />
            <CardBody className="space-y-4">
              <Field
                label="Marke"
                hinweis="Wird oben links in der Navigation gewechselt."
              >
                <input
                  value={markenname}
                  readOnly
                  className={`${eingabeKlassen} bg-slate-50 text-slate-600`}
                />
              </Field>

              <Field label="Zielgruppe">
                <select
                  value={audience}
                  onChange={(event) =>
                    setAudience(event.target.value as Audience)
                  }
                  className={eingabeKlassen}
                >
                  {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((wert) => (
                    <option key={wert} value={wert}>
                      {AUDIENCE_LABELS[wert]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ziel">
                <select
                  value={goal}
                  onChange={(event) =>
                    setGoal(event.target.value as ContentGoal)
                  }
                  className={eingabeKlassen}
                >
                  {GOAL_REIHENFOLGE.map((wert) => (
                    <option key={wert} value={wert}>
                      {GOAL_LABELS[wert]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Thema">
                <textarea
                  value={thema}
                  onChange={(event) => setThema(event.target.value)}
                  rows={3}
                  placeholder="z. B. Warum die Hautbarriere vor dem Wirkstoff kommt"
                  className={eingabeKlassen}
                />
              </Field>

              <Field label="Produkt (optional)">
                <select
                  value={produkt}
                  onChange={(event) => setProdukt(event.target.value)}
                  className={eingabeKlassen}
                >
                  <option value="">Kein Produkt</option>
                  {wissen?.produkte.map((eintrag) => (
                    <option key={eintrag.name} value={eintrag.name}>
                      {eintrag.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Button
                variante="primaer"
                onClick={erstellen}
                disabled={!thema.trim() || !rechte.darfInhalteErstellen}
                className="w-full"
              >
                Reel erstellen
              </Button>

              {!rechte.darfInhalteErstellen && (
                <p className="text-xs text-slate-500">
                  In der gewählten Rolle ist das Erstellen nicht möglich.
                </p>
              )}
            </CardBody>
          </Card>

          {hooks.length > 0 && (
            <Card>
              <CardHeader
                titel="Gespeicherte Hooks"
                beschreibung="Aus der Research übernommen"
              />
              <CardBody>
                <ul className="space-y-2.5">
                  {hooks.slice(0, 5).map((hook) => (
                    <li key={hook.id} className="text-sm text-slate-700">
                      <p>„{hook.text}“</p>
                      <p className="mt-0.5 text-xs text-slate-500">{hook.quelle}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {meldung && <Hinweis>{meldung}</Hinweis>}

          {entwurf ? (
            <ReelKarte
              item={entwurf}
              broll={broll}
              onChange={entwurfAendern}
              aktionen={
                <>
                  <Button
                    variante="primaer"
                    onClick={speichern}
                    disabled={!ungespeichert}
                  >
                    Speichern
                  </Button>
                  <Button onClick={freigeben} disabled={!rechte.darfFreigeben}>
                    Freigeben
                  </Button>
                  <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
                  <Button variante="dezent" onClick={hookAendern}>
                    Anderer Hook
                  </Button>
                  <Button variante="dezent" onClick={captionNeu}>
                    Andere Caption
                  </Button>
                  {ungespeichert && (
                    <span className="ml-auto text-xs font-medium text-amber-700">
                      Nicht gespeicherte Änderungen
                    </span>
                  )}
                </>
              }
            />
          ) : (
            <Card>
              <CardBody className="px-6 py-16 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  Noch kein Reel erstellt
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Fülle links die Vorgaben aus und klicke auf „Reel erstellen“.
                  Die Karte erscheint dann hier – mit Hook, B-Roll-Empfehlung,
                  Textoverlay, Caption und CTA. Alle Texte kannst du danach
                  direkt in der Karte überschreiben.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
