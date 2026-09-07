"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, Field, inputClass, Hinweis } from "@/components/ui";
import { MarkeninfoEintrag } from "@/lib/types";

// Kommagetrennte Eingabe in eine Liste umwandeln.
const alsListe = (text: string) =>
  text.split(",").map((t) => t.trim()).filter(Boolean);

export default function MarkenwissenPage() {
  const { markenwissen, saveMarkenwissen, rolle } = useStore();
  const [entwuerfe, setEntwuerfe] = useState<Record<string, MarkeninfoEintrag>>({});
  const [gespeichert, setGespeichert] = useState<string | null>(null);

  const istAdmin = rolle === "admin";

  useEffect(() => {
    const naechste: Record<string, MarkeninfoEintrag> = {};
    markenwissen.forEach((m) => {
      naechste[m.marke] = { ...m };
    });
    setEntwuerfe(naechste);
  }, [markenwissen]);

  const aendern = (marke: string, patch: Partial<MarkeninfoEintrag>) =>
    setEntwuerfe((e) => ({ ...e, [marke]: { ...e[marke], ...patch } }));

  return (
    <div>
      <PageHeader
        title="Markenwissen"
        subtitle="Zielgruppe, Tonalität, Produkte und Sprachregeln je Marke. Die Verbotsliste ist die Grundlage der Warnung vor heiklen Formulierungen."
      />

      {gespeichert && (
        <div className="mb-6">
          <Hinweis>Markenwissen für {gespeichert} gespeichert.</Hinweis>
        </div>
      )}

      <div className="space-y-4">
        {markenwissen.map((m) => {
          const e = entwuerfe[m.marke] ?? m;
          return (
            <Card key={m.marke}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-display text-xl">{m.marke}</div>
                {istAdmin && (
                  <Button
                    onClick={async () => {
                      await saveMarkenwissen(e);
                      setGespeichert(m.marke);
                      window.setTimeout(() => setGespeichert(null), 2500);
                    }}
                  >
                    Speichern
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Zielgruppe">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={e.zielgruppe}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { zielgruppe: ev.target.value })}
                  />
                </Field>
                <Field label="Tonalität">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={e.tonalitaet}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { tonalitaet: ev.target.value })}
                  />
                </Field>
                <Field label="Produkte (mit Komma trennen)">
                  <input
                    className={inputClass}
                    value={e.produkte.join(", ")}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { produkte: alsListe(ev.target.value) })}
                  />
                </Field>
                <Field label="Wörter vermeiden (mit Komma trennen)">
                  <input
                    className={inputClass}
                    value={e.woerterVermeiden.join(", ")}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { woerterVermeiden: alsListe(ev.target.value) })}
                    placeholder="Wundermittel, Faltenkiller, 100 % garantiert"
                  />
                </Field>
                <Field label="Kernbotschaften (mit Komma trennen)">
                  <input
                    className={inputClass}
                    value={e.kernbotschaften.join(", ")}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { kernbotschaften: alsListe(ev.target.value) })}
                  />
                </Field>
                <Field label="Standard-CTAs (mit Komma trennen)">
                  <input
                    className={inputClass}
                    value={e.standardCtas.join(", ")}
                    disabled={!istAdmin}
                    onChange={(ev) => aendern(m.marke, { standardCtas: alsListe(ev.target.value) })}
                  />
                </Field>
              </div>

              {e.woerterVermeiden.length > 0 && (
                <p className="text-xs text-taupe mt-4">
                  Diese Wörter werden in jeder Reel-Karte geprüft. Ein Treffer erzeugt eine
                  Warnung – das ist ein einfacher Wortabgleich und ersetzt keine rechtliche
                  Prüfung.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-taupe mt-6">
        Weitere Marken (SQT Homecare, Exoprime, Haut Zentrum) können in Supabase in der
        Tabelle <code>markenwissen</code> nach demselben Schema ergänzt werden.
      </p>
    </div>
  );
}
