"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Hinweis,
  PageHeader,
  Tag,
  eingabeKlassen,
} from "@/components/ui";
import { ideenErzeugen } from "@/lib/generator";
import { formatDatum, formatZahl } from "@/lib/labels";
import { mockAnalyse } from "@/lib/mock/research";
import { useStore } from "@/lib/store";
import type { ResearchResult, SavedHook, WatchedAccount } from "@/lib/types";

function Liste({ punkte }: { punkte: string[] }) {
  return (
    <ul className="space-y-2.5">
      {punkte.map((punkt) => (
        <li key={punkt} className="flex gap-2.5 text-sm text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marke-500" />
          <span>{punkt}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResearchSeite() {
  const { markeId, accounts, accountsSetzen, hooks, hooksSetzen } = useStore();
  const [handle, setHandle] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState<ResearchResult | null>(null);
  const [ideen, setIdeen] = useState<string[]>([]);
  const [meldung, setMeldung] = useState<string | null>(null);

  function analysieren() {
    if (!handle.trim()) return;
    setLaeuft(true);
    setMeldung(null);
    setIdeen([]);
    // Kurze künstliche Wartezeit, damit der Ablauf realistisch wirkt.
    window.setTimeout(() => {
      setErgebnis(mockAnalyse(handle));
      setLaeuft(false);
    }, 700);
  }

  function hooksSpeichern() {
    if (!ergebnis) return;
    const vorhandene = new Set(hooks.map((hook) => hook.text));
    const neue: SavedHook[] = ergebnis.haeufigeHooks
      .filter((text) => !vorhandene.has(text))
      .map((text, index) => ({
        id: `hook-${Date.now().toString(36)}-${index}`,
        brandId: markeId,
        text,
        quelle: ergebnis.handle,
        gespeichertAm: new Date().toISOString(),
      }));
    hooksSetzen([...hooks, ...neue]);
    setMeldung(
      neue.length > 0
        ? `${neue.length} Hooks gespeichert. Du findest sie beim Erstellen wieder.`
        : "Diese Hooks sind bereits gespeichert.",
    );
  }

  function accountBeobachten() {
    if (!ergebnis) return;
    if (accounts.some((account) => account.handle === ergebnis.handle)) {
      setMeldung("Dieser Account wird bereits beobachtet.");
      return;
    }
    const neu: WatchedAccount = {
      id: `acc-${Date.now().toString(36)}`,
      handle: ergebnis.handle,
      beschreibung: "Über die Research-Seite hinzugefügt.",
      kategorie: "Neu",
      follower: ergebnis.follower,
      hinzugefuegtAm: new Date().toISOString(),
      letzteAnalyse: ergebnis.analysiertAm,
    };
    accountsSetzen([...accounts, neu]);
    setMeldung(`${ergebnis.handle} wird jetzt beobachtet.`);
  }

  return (
    <>
      <PageHeader
        titel="Research"
        beschreibung="Analysiere einen Instagram-Account und leite daraus Themen, Hooks und Content-Chancen für deine Marke ab."
      />

      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="handle"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Instagram-Account
              </label>
              <input
                id="handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && analysieren()}
                placeholder="@skinlab.academy"
                className={eingabeKlassen}
              />
            </div>
            <Button
              variante="primaer"
              onClick={analysieren}
              disabled={!handle.trim() || laeuft}
              className="sm:w-auto"
            >
              {laeuft ? "Wird analysiert …" : "Account analysieren"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Diese Version arbeitet mit Beispieldaten. Eine echte Instagram-Analyse
            benötigt später einen kostenpflichtigen Datenzugang – dazu sprechen wir
            vorher.
          </p>
        </CardBody>
      </Card>

      {meldung && (
        <div className="mt-4">
          <Hinweis>{meldung}</Hinweis>
        </div>
      )}

      {!ergebnis && !laeuft && (
        <div className="mt-6">
          <EmptyState
            titel="Noch keine Analyse"
            beschreibung="Gib oben einen Account ein und starte die Analyse. Das Ergebnis zeigt Themen, Hooks, erfolgreiche Reels und Lücken, die du für SQT nutzen kannst."
          />
        </div>
      )}

      {ergebnis && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variante="primaer"
              onClick={() => setIdeen(ideenErzeugen(ergebnis.handle))}
            >
              10 Ideen für SQT erstellen
            </Button>
            <Button onClick={hooksSpeichern}>Erfolgreiche Hooks speichern</Button>
            <Button onClick={accountBeobachten}>Account beobachten</Button>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-slate-600">Follower</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatZahl(ergebnis.follower)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-600">Ø Aufrufe pro Reel</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatZahl(ergebnis.durchschnittlicheAufrufe)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-600">Posting-Frequenz</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {ergebnis.postingFrequenz}
              </p>
            </Card>
          </section>

          {ideen.length > 0 && (
            <Card className="mt-5">
              <CardHeader
                titel={`10 Ideen für ${ergebnis.handle}`}
                beschreibung="Vorschläge, übertragen auf deine Marke"
              />
              <CardBody>
                <ol className="space-y-2.5">
                  {ideen.map((idee, index) => (
                    <li key={idee} className="flex gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-marke-50 text-xs font-semibold text-marke-700">
                        {index + 1}
                      </span>
                      <span>{idee}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader titel="Erfolgreichste Themen" />
              <CardBody className="space-y-3.5">
                {ergebnis.topThemen.map((thema) => (
                  <div key={thema.thema}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">
                        {thema.thema}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        Ø {formatZahl(thema.reichweite)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-marke-600"
                        style={{ width: `${thema.anteilProzent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader titel="Häufigste Hooks" />
              <CardBody>
                <Liste punkte={ergebnis.haeufigeHooks} />
              </CardBody>
            </Card>
          </div>

          <Card className="mt-5">
            <CardHeader titel="Erfolgreichste Reels" />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">Reel</th>
                      <th className="px-5 py-3 font-medium">Format</th>
                      <th className="px-5 py-3 text-right font-medium">Aufrufe</th>
                      <th className="px-5 py-3 text-right font-medium">Likes</th>
                      <th className="px-5 py-3 text-right font-medium">Kommentare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ergebnis.topReels.map((reel) => (
                      <tr key={reel.titel}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{reel.titel}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Hook: „{reel.hook}“
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{reel.format}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-900">
                          {formatZahl(reel.aufrufe)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-600">
                          {formatZahl(reel.likes)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-600">
                          {formatZahl(reel.kommentare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader titel="Verwendete CTAs" />
              <CardBody>
                <Liste punkte={ergebnis.ctas} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader titel="Wiederkehrende Formate" />
              <CardBody className="flex flex-wrap gap-2">
                {ergebnis.formate.map((format) => (
                  <Tag key={format}>{format}</Tag>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="border-marke-200 bg-marke-50/40">
              <CardHeader titel="Content-Chancen für SQT" />
              <CardBody>
                <Liste punkte={ergebnis.chancenFuerSqt} />
              </CardBody>
            </Card>
            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader titel="Mögliche Content-Lücken" />
              <CardBody>
                <Liste punkte={ergebnis.contentLuecken} />
              </CardBody>
            </Card>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Analysiert am {formatDatum(ergebnis.analysiertAm)} · Beispieldaten
          </p>
        </>
      )}
    </>
  );
}
