"use client";

import { useEffect, useState } from "react";
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
  eingabeKlassen,
} from "@/components/ui";
import { AUDIENCE_LABELS, ROLE_LABELS, formatDatum } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { BrandKnowledge } from "@/lib/types";

/** Kommagetrennte Eingabe in eine Liste umwandeln und zurück. */
function alsListe(text: string): string[] {
  return text
    .split(",")
    .map((eintrag) => eintrag.trim())
    .filter(Boolean);
}

export default function MarkenwissenSeite() {
  const { wissen, wissenSpeichern, marken, markeId, rechte } = useStore();
  const marke = marken.find((eintrag) => eintrag.id === markeId);

  const [zielgruppe, setZielgruppe] = useState("");
  const [tonalitaet, setTonalitaet] = useState("");
  const [kernbotschaften, setKernbotschaften] = useState("");
  const [woerterVermeiden, setWoerterVermeiden] = useState("");
  const [standardCtas, setStandardCtas] = useState("");
  const [notizen, setNotizen] = useState("");
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    setZielgruppe(wissen?.zielgruppe ?? "");
    setTonalitaet(wissen?.tonalitaet.join(", ") ?? "");
    setKernbotschaften(wissen?.kernbotschaften.join("\n") ?? "");
    setWoerterVermeiden(wissen?.woerterVermeiden.join(", ") ?? "");
    setStandardCtas(wissen?.standardCtas.join("\n") ?? "");
    setNotizen(wissen?.notizen ?? "");
    setGespeichert(false);
  }, [wissen]);

  function speichern() {
    const aktualisiert: BrandKnowledge = {
      brandId: markeId,
      zielgruppe,
      tonalitaet: alsListe(tonalitaet),
      produkte: wissen?.produkte ?? [],
      kernbotschaften: kernbotschaften.split("\n").map((z) => z.trim()).filter(Boolean),
      woerterVermeiden: alsListe(woerterVermeiden),
      standardCtas: standardCtas.split("\n").map((z) => z.trim()).filter(Boolean),
      notizen,
      updatedAt: new Date().toISOString(),
    };
    wissenSpeichern(aktualisiert);
    setGespeichert(true);
  }

  if (!wissen) {
    return (
      <>
        <PageHeader
          titel="Markenwissen"
          beschreibung="Grundlage für jeden erzeugten Text: Zielgruppe, Tonalität, Produkte und Formulierungsregeln."
        />
        <EmptyState
          titel={`Noch kein Markenwissen für ${marke?.name ?? "diese Marke"}`}
          beschreibung="Für diese Marke ist bisher nichts hinterlegt. Lege es an, sobald Positionierung und Produkte feststehen – die Struktur ist dieselbe wie bei SQT B2B."
          aktion={
            <Button
              variante="primaer"
              onClick={() =>
                wissenSpeichern({
                  brandId: markeId,
                  zielgruppe: "",
                  tonalitaet: [],
                  produkte: [],
                  kernbotschaften: [],
                  woerterVermeiden: [],
                  standardCtas: [],
                  notizen: "",
                  updatedAt: new Date().toISOString(),
                })
              }
            >
              Markenwissen anlegen
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        titel="Markenwissen"
        beschreibung={`Grundlage für jeden erzeugten Text. Zuletzt geändert am ${formatDatum(wissen.updatedAt)}.`}
        aktionen={
          <Button
            variante="primaer"
            onClick={speichern}
            disabled={!rechte.darfMarkenwissenBearbeiten}
          >
            Speichern
          </Button>
        }
      />

      {gespeichert && (
        <div className="mb-5">
          <Hinweis>Markenwissen gespeichert.</Hinweis>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            titel="Positionierung"
            beschreibung={marke?.name ?? "Aktive Marke"}
          />
          <CardBody className="space-y-4">
            <Field label="Zielgruppe">
              <textarea
                value={zielgruppe}
                onChange={(event) => setZielgruppe(event.target.value)}
                rows={2}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
            <Field
              label="Tonalität"
              hinweis="Mehrere Begriffe mit Komma trennen."
            >
              <input
                value={tonalitaet}
                onChange={(event) => setTonalitaet(event.target.value)}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
            <Field
              label="Kernbotschaften"
              hinweis="Eine Botschaft pro Zeile."
            >
              <textarea
                value={kernbotschaften}
                onChange={(event) => setKernbotschaften(event.target.value)}
                rows={4}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titel="Sprachregeln"
            beschreibung="Was in Texten vermieden und was regelmäßig verwendet wird"
          />
          <CardBody className="space-y-4">
            <Field
              label="Wörter vermeiden"
              hinweis="Mehrere Begriffe mit Komma trennen."
            >
              <input
                value={woerterVermeiden}
                onChange={(event) => setWoerterVermeiden(event.target.value)}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
            <Field label="Standard-CTAs" hinweis="Ein CTA pro Zeile.">
              <textarea
                value={standardCtas}
                onChange={(event) => setStandardCtas(event.target.value)}
                rows={4}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
            <Field label="Interne Notizen">
              <textarea
                value={notizen}
                onChange={(event) => setNotizen(event.target.value)}
                rows={3}
                className={eingabeKlassen}
                disabled={!rechte.darfMarkenwissenBearbeiten}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          titel="Produkte"
          beschreibung="Werden beim Erstellen als Auswahl angeboten"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Produkt</th>
                  <th className="px-5 py-3 font-medium">Kurzbeschreibung</th>
                  <th className="px-5 py-3 font-medium">Zielgruppe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wissen.produkte.map((produkt) => (
                  <tr key={produkt.name}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {produkt.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {produkt.kurzbeschreibung}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {produkt.zielgruppe.map((eintrag) => (
                          <Tag key={eintrag}>{AUDIENCE_LABELS[eintrag]}</Tag>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader
          titel="Vorbereitung Kundenzugänge"
          beschreibung="Noch keine echten Konten – die Rechte sind aber bereits im Code hinterlegt"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-5 font-medium">Rolle</th>
                  <th className="py-3 pr-5 font-medium">Sieht</th>
                  <th className="py-3 pr-5 font-medium">Darf später</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 pr-5 font-medium text-slate-900">
                    {ROLE_LABELS.admin}
                  </td>
                  <td className="py-3.5 pr-5 text-slate-600">Alle Inhalte</td>
                  <td className="py-3.5 pr-5 text-slate-600">
                    Erstellen, freigeben, Accounts und Markenwissen verwalten
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-5 font-medium text-slate-900">
                    {ROLE_LABELS.studio_kunde}
                  </td>
                  <td className="py-3.5 pr-5 text-slate-600">
                    Nur freigegebene Inhalte
                  </td>
                  <td className="py-3.5 pr-5 text-slate-600">Caption kopieren</td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-5 font-medium text-slate-900">
                    {ROLE_LABELS.premium_kunde}
                  </td>
                  <td className="py-3.5 pr-5 text-slate-600">
                    Nur freigegebene Inhalte
                  </td>
                  <td className="py-3.5 pr-5 text-slate-600">
                    Caption kopieren, Video und Story herunterladen
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Die Rollen lassen sich links unten in der Navigation testweise
            umschalten, um die spätere Kundenansicht zu prüfen.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
