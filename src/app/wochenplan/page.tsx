"use client";

import { useState } from "react";
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
import { WOCHENTAGE, datumFuerTag, istHeute } from "@/lib/week";

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
  const [meldung, setMeldung] = useState<string | null>(null);

  function wocheErstellen() {
    const neueEintraege: PlanEntry[] = [];
    WOCHEN_MISCHUNG.forEach((vorlage, index) => {
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
      neueEintraege.push({
        id: `plan-${Date.now().toString(36)}-${index}`,
        brandId: markeId,
        kalenderwoche,
        tag: vorlage.tag,
        contentId: eintragItem.id,
        thema: vorlage.thema,
        goal: vorlage.goal,
        status: eintragItem.status,
        brollIds: eintragItem.brollIds,
        uhrzeit: vorlage.uhrzeit,
      });
    });
    planSetzen(neueEintraege);
    setMeldung(
      "Fünf Reels erstellt: 2× Education, 1× Produkt, 1× Behandlung verkaufen, 1× Reichweite. Die Entwürfe liegen in der Content-Bibliothek.",
    );
  }

  function statusAendern(eintragId: string, status: ContentStatus) {
    const aktualisiert = plan.map((eintrag) =>
      eintrag.id === eintragId ? { ...eintrag, status } : eintrag,
    );
    planSetzen(aktualisiert);

    // Status im zugehörigen Inhalt mitführen, damit die Bibliothek stimmt.
    const eintrag = plan.find((element) => element.id === eintragId);
    const zugehoerig = content.find((element) => element.id === eintrag?.contentId);
    if (zugehoerig) {
      contentSpeichern({
        ...zugehoerig,
        status,
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

  const nachTag = WOCHENTAGE.map((tag) => ({
    tag,
    eintraege: plan.filter((eintrag) => eintrag.tag === tag),
  })).filter(({ tag, eintraege }) => eintraege.length > 0 || WOCHENTAGE.indexOf(tag) < 5);

  return (
    <>
      <PageHeader
        titel="Wochenplan"
        beschreibung={`KW ${kalenderwoche.split("-W")[1]} / ${kalenderwoche.split("-W")[0]} – geplante Beiträge mit Ziel, Status und zugeordnetem B-Roll.`}
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

      {meldung && (
        <div className="mb-5">
          <Hinweis>{meldung}</Hinweis>
        </div>
      )}

      {plan.length === 0 ? (
        <EmptyState
          titel="Diese Woche ist noch leer"
          beschreibung="Erstelle mit einem Klick fünf Reels in ausgewogener Mischung – zwei Education, ein Produkt, ein Verkaufsreel und ein Reichweitenreel."
        />
      ) : (
        <>
          {/* Wochenansicht für große Bildschirme */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-5">
            {nachTag.slice(0, 5).map(({ tag, eintraege }) => (
              <div key={tag} className="flex flex-col gap-3">
                <div
                  className={cx(
                    "rounded-xl px-3 py-2.5 text-center",
                    istHeute(tag)
                      ? "bg-marke-700 text-white"
                      : "bg-white text-slate-900 ring-1 ring-slate-200",
                  )}
                >
                  <p className="text-sm font-semibold">{tag}</p>
                  <p
                    className={cx(
                      "text-xs",
                      istHeute(tag) ? "text-marke-100" : "text-slate-500",
                    )}
                  >
                    {formatDatumKurz(datumFuerTag(tag).toISOString())}
                  </p>
                </div>

                {eintraege.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                    frei
                  </div>
                ) : (
                  eintraege.map((eintrag) => (
                    <Card key={eintrag.id} className="p-4">
                      <p className="text-xs font-medium text-slate-500">
                        {eintrag.uhrzeit} Uhr
                      </p>
                      <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900">
                        {eintrag.thema}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {GOAL_LABELS[eintrag.goal]}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
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
                          statusAendern(
                            eintrag.id,
                            event.target.value as ContentStatus,
                          )
                        }
                        className="mt-3 w-full rounded-lg border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 outline-none focus:ring-2 focus:ring-marke-600"
                        aria-label={`Status für ${eintrag.tag}`}
                      >
                        {STATUS_REIHENFOLGE.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </Card>
                  ))
                )}
              </div>
            ))}
          </div>

          {/* Tabellenansicht für Tablet und Mobil */}
          <Card className="lg:hidden">
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {[...plan]
                  .sort(
                    (a, b) =>
                      WOCHENTAGE.indexOf(a.tag) - WOCHENTAGE.indexOf(b.tag),
                  )
                  .map((eintrag) => (
                    <li key={eintrag.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            {eintrag.tag} · {eintrag.uhrzeit} Uhr
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {eintrag.thema}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {GOAL_LABELS[eintrag.goal]}
                            {eintrag.brollIds.length > 0 &&
                              ` · B-Roll: ${eintrag.brollIds
                                .map(
                                  (id) =>
                                    broll.find((clip) => clip.id === id)?.code ??
                                    "?",
                                )
                                .join(", ")}`}
                          </p>
                        </div>
                        <StatusBadge status={eintrag.status} />
                      </div>
                      <select
                        value={eintrag.status}
                        onChange={(event) =>
                          statusAendern(
                            eintrag.id,
                            event.target.value as ContentStatus,
                          )
                        }
                        className={cx(eingabeKlassen, "mt-3 text-xs")}
                        aria-label={`Status für ${eintrag.tag}`}
                      >
                        {STATUS_REIHENFOLGE.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
              </ul>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
