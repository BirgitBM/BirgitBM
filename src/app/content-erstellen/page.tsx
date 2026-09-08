"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, Field, inputClass, Hinweis } from "@/components/ui";
import { ReelKarte } from "@/components/ReelKarte";
import { reelAlsText } from "@/lib/reelText";
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
  brollIds: string[];
}): ReelCard {
  const id = `R${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const jetzt = new Date().toISOString();
  return {
    id,
    marke: input.marke,
    zielgruppe: input.zielgruppe,
    ziel: input.ziel,
    thema: input.thema,
    produkt: input.produkt || undefined,
    hook: `${hookVorlagen[input.ziel]} ${input.thema.toLowerCase()}.`,
    brollEmpfehlung: "Ruhiger Einstieg, danach Detailaufnahme zum Kernpunkt.",
    brollIds: input.brollIds,
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
    erstelltAm: jetzt.slice(0, 10),
    geaendertAm: jetzt,
    renderStatus: "offen",
    freigegebenFuerKunden: false,
  };
}

export default function ContentErstellenPage() {
  const { addReel, updateReel, reels, broll, markenwissen } = useStore();
  const [marke, setMarke] = useState<Marke>("SQT B2B");
  const [zielgruppe, setZielgruppe] = useState<Zielgruppe>("Kosmetikerinnen");
  const [ziel, setZiel] = useState<ContentZiel>("Education");
  const [thema, setThema] = useState("");
  const [produkt, setProdukt] = useState("");
  const [aktuellesReel, setAktuellesReel] = useState<ReelCard | null>(null);
  const [kopiert, setKopiert] = useState(false);

  const warnWoerter =
    markenwissen.find((m) => m.marke === (aktuellesReel?.marke ?? marke))?.woerterVermeiden ?? [];

  // Jede Änderung geht direkt an Supabase; der Bildschirm zeigt sie sofort.
  const aendern = (patch: Partial<ReelCard>) => {
    if (!aktuellesReel) return;
    setAktuellesReel({ ...aktuellesReel, ...patch });
    updateReel(aktuellesReel.id, patch);
  };

  const kopieren = async () => {
    if (!aktuellesReel) return;
    const clips = broll.filter((c) => aktuellesReel.brollIds.includes(c.id));
    try {
      await navigator.clipboard.writeText(reelAlsText(aktuellesReel, clips));
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2000);
    } catch {
      setKopiert(false);
    }
  };

  const erstellen = () => {
    if (!thema.trim()) return;
    // Zwei passende Clips vorschlagen: bevorzugt zum Produkt, sonst die ersten.
    const passend = broll.filter(
      (c) => produkt.trim() && c.produkt?.toLowerCase() === produkt.trim().toLowerCase()
    );
    const vorschlag = (passend.length > 0 ? passend : broll).slice(0, 2).map((c) => c.id);
    const reel = generiereReel({
      marke,
      zielgruppe,
      ziel,
      thema: thema.trim(),
      produkt: produkt.trim(),
      brollIds: vorschlag,
    });
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
    aendern({ hook: neu });
  };

  const captionNeuSchreiben = () => {
    if (!aktuellesReel) return;
    const neu = `Ein genauerer Blick auf ${aktuellesReel.thema.toLowerCase()} – und warum es für ${aktuellesReel.zielgruppe === "Kosmetikerinnen" ? "deine Behandlungsergebnisse" : "deine Haut"} einen Unterschied macht.`;
    aendern({ caption: neu });
  };

  const freigeben = () => {
    aendern({ status: "Freigegeben", freigegebenFuerKunden: true });
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
        <div className="space-y-4">
          {kopiert && <Hinweis>Der vollständige Text liegt in der Zwischenablage.</Hinweis>}
          <ReelKarte
            reel={aktuellesReel}
            broll={broll}
            warnWoerter={warnWoerter}
            onChange={aendern}
            onBrollChange={(brollIds) => aendern({ brollIds })}
            onStatusChange={(status) => aendern({ status })}
            aktionen={
              <>
                <Button onClick={freigeben}>Freigeben</Button>
                <Button variant="secondary" onClick={kopieren}>
                  {kopiert ? "Kopiert" : "Alles kopieren"}
                </Button>
                <Button variant="secondary" onClick={hookAendern}>Anderer Hook</Button>
                <Button variant="secondary" onClick={captionNeuSchreiben}>Andere Caption</Button>
                <Button variant="ghost" onClick={() => setAktuellesReel(null)}>Schliessen</Button>
              </>
            }
          />
        </div>
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
