"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  IconBibliothek,
  IconErstellen,
  IconPfeil,
  IconPlan,
  IconResearch,
} from "@/components/icons";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatusBadge,
  cx,
} from "@/components/ui";
import { GOAL_LABELS, formatDatum } from "@/lib/labels";
import { markeFinden } from "@/lib/mock/brands";
import { useStore } from "@/lib/store";
import { WOCHENTAGE, datumFuerTag, istHeute } from "@/lib/week";

const SCHNELLZUGRIFFE = [
  {
    href: "/research",
    titel: "Research",
    text: "Instagram-Account analysieren und Ideen ableiten",
    Icon: IconResearch,
  },
  {
    href: "/erstellen",
    titel: "Content erstellen",
    text: "Neues Reel aus Marke, Ziel und Thema erzeugen",
    Icon: IconErstellen,
  },
  {
    href: "/wochenplan",
    titel: "Wochenplan",
    text: "Die fünf Reels dieser Woche im Blick",
    Icon: IconPlan,
  },
  {
    href: "/bibliothek",
    titel: "Content-Bibliothek",
    text: "Alle Inhalte filtern und wiederfinden",
    Icon: IconBibliothek,
  },
];

function KennzahlKarte({
  label,
  wert,
  hinweis,
  akzent,
}: {
  label: string;
  wert: number | string;
  hinweis: string;
  akzent: string;
}) {
  return (
    <Card className="p-5">
      <div className={cx("mb-3 h-1 w-10 rounded-full", akzent)} />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
        {wert}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">{hinweis}</p>
    </Card>
  );
}

export default function DashboardSeite() {
  const { content, plan, benutzer, markeId, bereit } = useStore();
  const marke = markeFinden(markeId);

  const kennzahlen = useMemo(() => {
    const geplant = plan.length;
    const fertig = content.filter(
      (eintrag) =>
        eintrag.status === "produziert" || eintrag.status === "veroeffentlicht",
    ).length;
    const offen = content.filter(
      (eintrag) => eintrag.status === "idee" || eintrag.status === "entwurf",
    ).length;
    const freigegeben = content.filter(
      (eintrag) => eintrag.status === "freigegeben",
    ).length;
    return { geplant, fertig, offen, freigegeben };
  }, [content, plan]);

  /**
   * Nächster offener Eintrag. Ist die Woche bereits durch, wird der erste
   * Eintrag der Folgewoche gezeigt – dann liegt das Datum sieben Tage später.
   */
  const naechsterBeitrag = useMemo(() => {
    const heuteIndex = (new Date().getDay() + 6) % 7;
    const sortiert = [...plan]
      .filter((eintrag) => eintrag.status !== "veroeffentlicht")
      .sort((a, b) => WOCHENTAGE.indexOf(a.tag) - WOCHENTAGE.indexOf(b.tag));
    if (sortiert.length === 0) return null;

    const dieseWoche = sortiert.find(
      (eintrag) => WOCHENTAGE.indexOf(eintrag.tag) >= heuteIndex,
    );
    const eintrag = dieseWoche ?? sortiert[0];
    const datum = datumFuerTag(eintrag.tag);
    if (!dieseWoche) datum.setDate(datum.getDate() + 7);
    return { eintrag, datum };
  }, [plan]);

  return (
    <>
      <PageHeader
        titel={`Guten Tag, ${benutzer.name}`}
        beschreibung={`Wochenübersicht für ${marke?.name ?? "die aktive Marke"}. Alle Zahlen basieren in dieser Version auf Beispieldaten.`}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KennzahlKarte
          label="Geplante Reels"
          wert={kennzahlen.geplant}
          hinweis="Einträge im Wochenplan"
          akzent="bg-marke-500"
        />
        <KennzahlKarte
          label="Fertige Reels"
          wert={kennzahlen.fertig}
          hinweis="Produziert oder veröffentlicht"
          akzent="bg-violet-500"
        />
        <KennzahlKarte
          label="Offene Inhalte"
          wert={kennzahlen.offen}
          hinweis="Ideen und Entwürfe ohne Freigabe"
          akzent="bg-amber-500"
        />
        <KennzahlKarte
          label="Freigegeben"
          wert={kennzahlen.freigegeben}
          hinweis="Bereit für die Produktion"
          akzent="bg-emerald-500"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titel="Nächster geplanter Beitrag"
            beschreibung="Der nächste offene Eintrag aus dem Wochenplan"
            aktion={
              <Link
                href="/wochenplan"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-marke-700 hover:text-marke-800"
              >
                Wochenplan
                <IconPfeil className="h-4 w-4" />
              </Link>
            }
          />
          <CardBody>
            {!bereit ? (
              <p className="text-sm text-slate-500">Daten werden geladen …</p>
            ) : naechsterBeitrag ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-900">
                      {naechsterBeitrag.eintrag.tag}
                      {istHeute(naechsterBeitrag.eintrag.tag) && " (heute)"}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatDatum(naechsterBeitrag.datum.toISOString())}</span>
                    <span aria-hidden>·</span>
                    <span>{naechsterBeitrag.eintrag.uhrzeit} Uhr</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {naechsterBeitrag.eintrag.thema}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Ziel: {GOAL_LABELS[naechsterBeitrag.eintrag.goal]}
                  </p>
                </div>
                <StatusBadge status={naechsterBeitrag.eintrag.status} />
              </div>
            ) : (
              <EmptyState
                titel="Noch nichts geplant"
                beschreibung="Für diese Woche ist kein Beitrag eingetragen. Lege im Wochenplan die fünf Reels an."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader titel="Diese Woche" beschreibung="Verteilung nach Ziel" />
          <CardBody className="space-y-3">
            {plan.length === 0 ? (
              <p className="text-sm text-slate-500">Kein Eintrag vorhanden.</p>
            ) : (
              Object.entries(
                plan.reduce<Record<string, number>>((summe, eintrag) => {
                  const label = GOAL_LABELS[eintrag.goal];
                  summe[label] = (summe[label] ?? 0) + 1;
                  return summe;
                }, {}),
              ).map(([label, anzahl]) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {anzahl}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-marke-600"
                      style={{ width: `${(anzahl / plan.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Schnellzugriffe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SCHNELLZUGRIFFE.map(({ href, titel, text, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-marke-300 hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-marke-50 text-marke-700 group-hover:bg-marke-100">
                <Icon />
              </span>
              <p className="mt-3.5 text-sm font-semibold text-slate-900">{titel}</p>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader
            titel="Zuletzt bearbeitet"
            beschreibung="Die vier jüngsten Inhalte dieser Marke"
            aktion={
              <Link
                href="/bibliothek"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-marke-700 hover:text-marke-800"
              >
                Alle ansehen
                <IconPfeil className="h-4 w-4" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {content.length === 0 ? (
              <div className="px-5 py-8">
                <p className="text-sm text-slate-500">
                  Noch keine Inhalte für diese Marke.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {[...content]
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .slice(0, 4)
                  .map((eintrag) => (
                    <li
                      key={eintrag.id}
                      className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {eintrag.thema}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {GOAL_LABELS[eintrag.goal]} · geändert am{" "}
                          {formatDatum(eintrag.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={eintrag.status} />
                    </li>
                  ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </>
  );
}
