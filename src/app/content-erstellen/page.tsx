"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, StatusPill, Field, inputClass } from "@/components/ui";
import {
  ContentZiel,
  Marke,
  ReelCard,
  Zielgruppe,
} from "@/lib/types";

const marken: Marke[] = ["SQT B2B", "SQT Homecare", "Exoprime", "Haut Zentrum"];
const zielgruppen: Zielgruppe[] = ["Kosmetikerinnen", "Endkunden"];
const ziele: ContentZiel[] = [
  "Reichweite",
  "Education",
  "Produktverkauf",
  "Behandlung verkaufen",
  "neue Studios gewinnen",
  "Vertrauen",
  "Einwand beantworten",
];

const hookVorlagen: Record<ContentZiel, string> = {
  Reichweite: "Das wissen die wenigsten über",
  Education: "Die meisten machen diesen Fehler bei",
  Produktverkauf: "Der Unterschied, den du sofort spürst bei",
  "Behandlung verkaufen": "Warum diese Behandlung anders wirkt als",
  "neue Studios gewinnen": "Was Studios übersehen, wenn sie über",
  Vertrauen: "Das steckt wirklich hinter",
  "Einwand beantworten": "\"Lohnt sich das überhaupt?\" – die ehrliche Antwort zu",
};

function generiereReel(input: {
  marke: Marke;
  zielgruppe: Zielgruppe;
  ziel: ContentZiel;
  thema: string;
  produkt: string;
}): ReelCard {
  const id = `R${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return {
    id,
    marke: input.marke,
    zielgruppe: input.zielgruppe,
    ziel: input.ziel,
    thema: input.thema,
    produkt: input.produkt || undefined,
    hook: `${hookVorlagen[input.ziel]} ${input.thema.toLowerCase()}.`,
    brollEmpfehlung: "B004 – Behandlungsvorbereitung",
    textOverlays: [
      { zeit: "0:00–0:03", text: input.thema },
      { zeit: "0:03–0:10", text: "So wirkt es in der Praxis" },
      { zeit: "0:10–0:15", text: "Das nimmst du mit" },
    ],
    caption: `${input.thema}. Ein Blick auf das, was für ${input.zielgruppe === "Kosmetikerinnen" ? "dich als Kosmetikerin" : "deine Haut"} wirklich zählt${input.produkt ? ` – mit ${input.produkt}` : ""}.`,
    cta:
      input.ziel === "Produktverkauf" || input.ziel === "Behandlung verkaufen"
        ? "Jetzt Termin sichern"
        : "Mehr dazu im Profil",
    status: "Entwurf",
    contentArt: "Reel",
    erstelltAm: new Date().toISOString().slice(0, 10),
    freigegebenFuerKunden: false,
  };
}

export default function ContentErstellenPage() {
  const { addReel, updateReel, reels } = useStore();
  const [marke, setMarke] = useState<Marke>("SQT B2B");
  const [zielgruppe, setZielgruppe] = useState<Zielgruppe>("Kosmetikerinnen");
  const [ziel, setZiel] = useState<ContentZiel>("Education");
  const [thema, setThema] = useState("");
  const [produkt, setProdukt] = useState("");
  const [aktuellesReel, setAktuellesReel] = useState<ReelCard | null>(null);

  const erstellen = () => {
    if (!thema.trim()) return;
    const reel = generiereReel({ marke, zielgruppe, ziel, thema: thema.trim(), produkt: produkt.trim() });
    addReel(reel);
    setAktuellesReel(reel);
  };

  const hookAendern = () => {
    if (!aktuellesReel) return;
    const varianten = [
      `Stopp – bevor du ${aktuellesReel.thema.toLowerCase()} nächstes Mal so erklärst.`,
      `${aktuellesReel.thema}: der Teil, den keiner zeigt.`,
      `Frage an dich: Machst du das bei ${aktuellesReel.thema.toLowerCase()} auch falsch?`,
    ];
    const neu = varianten[Math.floor(Math.random() * varianten.length)];
    const patch = { hook: neu };
    updateReel(aktuellesReel.id, patch);
    setAktuellesReel({ ...aktuellesReel, ...patch });
  };

  const captionNeuSchreiben = () => {
    if (!aktuellesReel) return;
    const neu = `Ein genauerer Blick auf ${aktuellesReel.thema.toLowerCase()} – und warum es für ${aktuellesReel.zielgruppe === "Kosmetikerinnen" ? "deine Behandlungsergebnisse" : "deine Haut"} einen Unterschied macht.`;
    const patch = { caption: neu };
    updateReel(aktuellesReel.id, patch);
    setAktuellesReel({ ...aktuellesReel, ...patch });
  };

  const freigeben = () => {
    if (!aktuellesReel) return;
    const patch = { status: "Freigegeben" as const };
    updateReel(aktuellesReel.id, patch);
    setAktuellesReel({ ...aktuellesReel, ...patch });
  };

  return (
    <div>
      <PageHeader
        title="Content erstellen"
        subtitle="Definiere die Eckdaten – ContentOS erstellt daraus eine vollständige Reel-Karte."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Marke">
            <select className={inputClass} value={marke} onChange={(e) => setMarke(e.target.value as Marke)}>
              {marken.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Zielgruppe">
            <select className={inputClass} value={zielgruppe} onChange={(e) => setZielgruppe(e.target.value as Zielgruppe)}>
              {zielgruppen.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Ziel">
            <select className={inputClass} value={ziel} onChange={(e) => setZiel(e.target.value as ContentZiel)}>
              {ziele.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Produkt (optional)">
            <input className={inputClass} value={produkt} onChange={(e) => setProdukt(e.target.value)} placeholder="z.B. Radiance" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Thema">
              <input
                className={inputClass}
                value={thema}
                onChange={(e) => setThema(e.target.value)}
                placeholder="z.B. Warum Ergebnisse erst nach 3 Behandlungen sichtbar werden"
              />
            </Field>
          </div>
        </div>
        <div className="mt-5">
          <Button onClick={erstellen} disabled={!thema.trim()}>Reel erstellen</Button>
        </div>
      </Card>

      {aktuellesReel && (
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-taupe">{aktuellesReel.marke} · {aktuellesReel.zielgruppe} · {aktuellesReel.ziel}</div>
              <div className="font-display text-xl mt-1">{aktuellesReel.thema}</div>
            </div>
            <StatusPill status={aktuellesReel.status} />
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="font-medium text-taupe mb-1">Hook</div>
              <p>{aktuellesReel.hook}</p>
            </div>
            <div>
              <div className="font-medium text-taupe mb-1">B-Roll-Empfehlung</div>
              <p>{aktuellesReel.brollEmpfehlung}</p>
            </div>
            <div>
              <div className="font-medium text-taupe mb-1">Textoverlay</div>
              <ul className="space-y-1">
                {aktuellesReel.textOverlays.map((o, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-taupe w-20 shrink-0">{o.zeit}</span>
                    <span>{o.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-taupe mb-1">Caption</div>
              <p>{aktuellesReel.caption}</p>
            </div>
            <div>
              <div className="font-medium text-taupe mb-1">CTA</div>
              <p>{aktuellesReel.cta}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-line">
            <Button onClick={freigeben}>Freigeben</Button>
            <Button variant="secondary" onClick={hookAendern}>Hook ändern</Button>
            <Button variant="secondary" onClick={captionNeuSchreiben}>Caption neu schreiben</Button>
            <Button variant="secondary" onClick={() => setAktuellesReel(null)}>Speichern &amp; schließen</Button>
          </div>
        </Card>
      )}

      {!aktuellesReel && reels.length > 0 && (
        <p className="text-sm text-taupe mt-6">
          Zuletzt erstellt: {reels[0].thema} — Details in der{" "}
          <a href="/bibliothek" className="underline">Content-Bibliothek</a>.
        </p>
      )}
    </div>
  );
}
