"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Hinweis,
  PageHeader,
  StatusBadge,
  cx,
  eingabeKlassen,
} from "@/components/ui";
import { reelErzeugen } from "@/lib/generator";
import {
  GOAL_LABELS,
  GOAL_REIHENFOLGE,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
  formatDatumKurz,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type {
  ContentGoal,
  ContentItem,
  ContentStatus,
  PlanEntry,
  Wochentag,
} from "@/lib/types";
import {
  WOCHENTAGE,
  datumInWoche,
  istHeute,
  wocheVerschieben,
  wochenBeschriftung,
} from "@/lib/week";

/** Empfohlene Wochenmischung: 2 Education, 1 Produkt, 1 Verkauf, 1 Reichweite. */
const WOCHEN_MISCHUNG: Array<{
  tag: Wochentag;
  goal: ContentGoal;
  thema: string;
  uhrzeit: string;
}> = [
  {
    tag: "Montag",
    goal: "education",
    thema: "Hautbarriere verstehen: was vor jedem Wirkstoff kommt",
    uhrzeit: "11:00",
  },
  {
    tag: "Dienstag",
    goal: "education",
    thema: "Ampullen richtig anwenden – die drei häufigsten Fehler",
    uhrzeit: "10:00",
  },
  {
    tag: "Mittwoch",
    goal: "produktverkauf",
    thema: "Welches Set für welchen Hautzustand",
    uhrzeit: "17:30",
  },
  {
    tag: "Donnerstag",
    goal: "behandlung_verkaufen",
    thema: "Behandlungsablauf in 20 Sekunden erklärt",
    uhrzeit: "12:00",
  },
  {
    tag: "Freitag",
    goal: "reichweite",
    thema: "Was ich nach 200 Behandlungen anders mache",
    uhrzeit: "18:00",
  },
];

export default function WochenplanSeite() {
  const {
    plan,
    planSetzen,
    broll,
    content,
    contentSpeichern,
    markeId,
    kalenderwoche,
    rechte,
  } = useStore();

  const [woche, setWoche] = useState(kalenderwoche);
  const [meldung, setMeldung] = useState<string | null>(null);

  const wocheneintraege = useMemo(
    () => plan.filter((eintrag) => eintrag.kalenderwoche === woche),
    [plan, woche],
  );

  /** Ersetzt nur die gewählte Woche; andere Wochen bleiben unangetastet. */
  function wocheSetzen(neueEintraege: PlanEntry[]) {
    planSetzen([
      ...plan.filter((eintrag) => eintrag.kalenderwoche !== woche),
      ...neueEintraege,
    ]);
  }

  function wocheErstellen() {
    const neueEintraege: PlanEntry[] = WOCHEN_MISCHUNG.map((vorlage, index) => {
      const item: ContentItem = reelErzeugen(
        {
          brandId: markeId,
          audience: "kosmetikerinnen",
          goal: vorlage.goal,
          thema: vorlage.thema,
        },
        "user-admin",
      );
      // Eindeutige ID, auch wenn alle fünf in derselben Millisekunde entstehen.
      const eintragItem = { ...item, id: `${item.id}-${index}` };
      contentSpeichern(eintragItem);
      return {
        id: `plan-${Date.now().toString(36)}-${index}`,
        brandId: markeId,
        kalenderwoche: woche,
        tag: vorlage.tag,
        contentId: eintragItem.id,
        thema: vorlage.thema,
        goal: vorlage.goal,
        status: eintragItem.status,
        brollIds: eintragItem.brollIds,
        uhrzeit: vorlage.uhrzeit,
      };
    });
    wocheSetzen(neueEintraege);
    setMeldung(
      "Fünf Reels erstellt: 2× Education, 1× Produkt, 1× Behandlung verkaufen, 1× Reichweite. Die Entwürfe liegen in der Content-Bibliothek.",
    );
  }

  function eintragHinzufuegen(tag: Wochentag) {
    const neuerEintrag: PlanEntry = {
      id: `plan-${Date.now().toString(36)}`,
      brandId: markeId,
      kalenderwoche: woche,
      tag,
      thema: "Neuer Beitrag",
      goal: "education",
      status: "idee",
      brollIds: [],
      uhrzeit: "12:00",
    };
    wocheSetzen([...wocheneintraege, neuerEintrag]);
    setMeldung(null);
  }

  function eintragAendern(id: string, teil: Partial<PlanEntry>) {
    const aktualisiert = wocheneintraege.map((eintrag) =>
      eintrag.id === id ? { ...eintrag, ...teil } : eintrag,
    );
    wocheSetzen(aktualisiert);

    // Status und Thema im zugehörigen Inhalt mitführen, damit die Bibliothek stimmt.
    const eintrag = wocheneintraege.find((element) => element.id === id);
    const zugehoerig = content.find(
      (element) => element.id === eintrag?.contentId,
    );
    if (zugehoerig && (teil.status || teil.thema)) {
      const status = teil.status ?? zugehoerig.status;
      contentSpeichern({
        ...zugehoerig,
        status,
        thema: teil.thema ?? zugehoerig.thema,
        visibility:
          status === "freigegeben" ||
          status === "produziert" ||
          status === "veroeffentlicht"
            ? "kunde"
            : zugehoerig.visibility,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  function eintragEntfernen(id: string) {
    wocheSetzen(wocheneintraege.filter((eintrag) => eintrag.id !== id));
  }

  const werktage = WOCHENTAGE.slice(0, 5);
  const wochenende = WOCHENTAGE.slice(5);
  const sichtbareTage = wochenende.some((tag) =>
    wocheneintraege.some((eintrag) => eintrag.tag === tag),
  )
    ? WOCHENTAGE
    : werktage;

  return (
    <>
      <PageHeader
        titel="Wochenplan"
        beschreibung="Geplante Beiträge mit Ziel, Status und zugeordnetem B-Roll. Einträge lassen sich einzeln anlegen, verschieben und entfernen."
        aktionen={
          <Button
            variante="primaer"
            onClick={wocheErstellen}
            disabled={!rechte.darfInhalteErstellen}
          >
            5 Reels für diese Woche erstellen
          </Button>
        }
      />

      <Card className="mb-5">
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variante="sekundaer"
              onClick={() => setWoche(wocheVerschieben(woche, -1))}
              aria-label="Vorherige Woche"
            >
              ←
            </Button>
            <span className="min-w-[15rem] text-center text-sm font-semibold text-slate-900">
              {wochenBeschriftung(woche)}
            </span>
            <Button
              variante="sekundaer"
              onClick={() => setWoche(wocheVerschieben(woche, 1))}
              aria-label="Nächste Woche"
            >
              →
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {wocheneintraege.length}{" "}
              {wocheneintraege.length === 1 ? "Beitrag" : "Beiträge"}
            </span>
            {woche !== kalenderwoche && (
              <button
                type="button"
                onClick={() => setWoche(kalenderwoche)}
                className="text-xs font-medium text-marke-700 hover:text-marke-800"
              >
                Zur aktuellen Woche
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {meldung && (
        <div className="mb-5">
          <Hinweis>{meldung}</Hinweis>
        </div>
      )}

      {wocheneintraege.length === 0 ? (
        <EmptyState
          titel="Diese Woche ist noch leer"
          beschreibung="Erstelle mit einem Klick fünf Reels in ausgewogener Mischung – oder lege einzelne Beiträge an."
          aktion={
            <Button onClick={() => eintragHinzufuegen("Montag")}>
              Einzelnen Beitrag anlegen
            </Button>
          }
        />
      ) : (
        <>
          {/* Wochenansicht für große Bildschirme */}
          <div
            className={cx(
              "hidden gap-4 lg:grid",
              sichtbareTage.length > 5 ? "lg:grid-cols-7" : "lg:grid-cols-5",
            )}
          >
            {sichtbareTage.map((tag) => {
              const eintraege = wocheneintraege.filter(
                (eintrag) => eintrag.tag === tag,
              );
              return (
                <div key={tag} className="flex flex-col gap-3">
                  <div
                    className={cx(
                      "rounded-xl px-3 py-2.5 text-center",
                      istHeute(tag) && woche === kalenderwoche
                        ? "bg-marke-700 text-white"
                        : "bg-white text-slate-900 ring-1 ring-slate-200",
                    )}
                  >
                    <p className="text-sm font-semibold">{tag}</p>
                    <p
                      className={cx(
                        "text-xs",
                        istHeute(tag) && woche === kalenderwoche
                          ? "text-marke-100"
                          : "text-slate-500",
                      )}
                    >
                      {formatDatumKurz(datumInWoche(woche, tag).toISOString())}
                    </p>
                  </div>

                  {eintraege.map((eintrag) => (
                    <Card key={eintrag.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          value={eintrag.uhrzeit}
                          onChange={(event) =>
                            eintragAendern(eintrag.id, {
                              uhrzeit: event.target.value,
                            })
                          }
                          aria-label={`Uhrzeit ${eintrag.thema}`}
                          className="w-16 rounded bg-transparent px-1 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-transparent hover:ring-slate-300 focus:ring-2 focus:ring-marke-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => eintragEntfernen(eintrag.id)}
                          className="rounded px-1 text-xs text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`${eintrag.thema} entfernen`}
                        >
                          ✕
                        </button>
                      </div>

                      <textarea
                        value={eintrag.thema}
                        onChange={(event) =>
                          eintragAendern(eintrag.id, {
                            thema: event.target.value,
                          })
                        }
                        rows={3}
                        aria-label="Thema"
                        className="mt-1.5 w-full resize-none rounded bg-transparent px-1 py-0.5 text-sm font-semibold leading-snug text-slate-900 ring-1 ring-inset ring-transparent hover:ring-slate-300 focus:ring-2 focus:ring-marke-600 focus:outline-none"
                      />

                      <select
                        value={eintrag.goal}
                        onChange={(event) =>
                          eintragAendern(eintrag.id, {
                            goal: event.target.value as ContentGoal,
                          })
                        }
                        aria-label={`Ziel für ${eintrag.tag}`}
                        className="mt-2 w-full rounded-lg border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 outline-none focus:ring-2 focus:ring-marke-600"
                      >
                        {GOAL_REIHENFOLGE.map((ziel) => (
                          <option key={ziel} value={ziel}>
                            {GOAL_LABELS[ziel]}
                          </option>
                        ))}
                      </select>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {eintrag.brollIds.map((id) => {
                          const clip = broll.find((element) => element.id === id);
                          return clip ? (
                            <span
                              key={id}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                              title={clip.titel}
                            >
                              {clip.code}
                            </span>
                          ) : null;
                        })}
                      </div>

                      <select
                        value={eintrag.status}
                        onChange={(event) =>
                          eintragAendern(eintrag.id, {
                            status: event.target.value as ContentStatus,
                          })
                        }
                        className="mt-2 w-full rounded-lg border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 outline-none focus:ring-2 focus:ring-marke-600"
                        aria-label={`Status für ${eintrag.tag}`}
                      >
                        {STATUS_REIHENFOLGE.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      <select
                        value={eintrag.tag}
                        onChange={(event) =>
                          eintragAendern(eintrag.id, {
                            tag: event.target.value as Wochentag,
                          })
                        }
                        className="mt-2 w-full rounded-lg border-0 bg-white px-2 py-1.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 outline-none focus:ring-2 focus:ring-marke-600"
                        aria-label={`Tag für ${eintrag.thema}`}
                      >
                        {WOCHENTAGE.map((element) => (
                          <option key={element} value={element}>
                            Verschieben auf {element}
                          </option>
                        ))}
                      </select>
                    </Card>
                  ))}

                  <button
                    type="button"
                    onClick={() => eintragHinzufuegen(tag)}
                    className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-medium text-slate-500 transition hover:border-marke-400 hover:text-marke-700"
                  >
                    + Beitrag
                  </button>
                </div>
              );
            })}
          </div>

          {/* Listenansicht für Tablet und Mobil */}
          <Card className="lg:hidden">
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {[...wocheneintraege]
                  .sort(
                    (a, b) =>
                      WOCHENTAGE.indexOf(a.tag) - WOCHENTAGE.indexOf(b.tag),
                  )
                  .map((eintrag) => (
                    <li key={eintrag.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500">
                            {eintrag.tag} · {eintrag.uhrzeit} Uhr
                          </p>
                          <textarea
                            value={eintrag.thema}
                            onChange={(event) =>
                              eintragAendern(eintrag.id, {
                                thema: event.target.value,
                              })
                            }
                            rows={2}
                            aria-label="Thema"
                            className="mt-1 w-full resize-none rounded bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-transparent hover:ring-slate-300 focus:ring-2 focus:ring-marke-600 focus:outline-none"
                          />
                        </div>
                        <StatusBadge status={eintrag.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <select
                          value={eintrag.tag}
                          onChange={(event) =>
                            eintragAendern(eintrag.id, {
                              tag: event.target.value as Wochentag,
                            })
                          }
                          className={cx(eingabeKlassen, "text-xs")}
                          aria-label={`Tag für ${eintrag.thema}`}
                        >
                          {WOCHENTAGE.map((element) => (
                            <option key={element} value={element}>
                              {element}
                            </option>
                          ))}
                        </select>
                        <select
                          value={eintrag.status}
                          onChange={(event) =>
                            eintragAendern(eintrag.id, {
                              status: event.target.value as ContentStatus,
                            })
                          }
                          className={cx(eingabeKlassen, "text-xs")}
                          aria-label={`Status für ${eintrag.tag}`}
                        >
                          {STATUS_REIHENFOLGE.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => eintragEntfernen(eintrag.id)}
                        className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        Beitrag entfernen
                      </button>
                    </li>
                  ))}
              </ul>
              <div className="border-t border-slate-100 px-5 py-4">
                <Button onClick={() => eintragHinzufuegen("Montag")}>
                  Beitrag hinzufügen
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
