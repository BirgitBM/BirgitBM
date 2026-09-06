"use client";

import { useState } from "react";
import { IconMuell } from "@/components/icons";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Tag,
  eingabeKlassen,
} from "@/components/ui";
import { formatDatum, formatZahl } from "@/lib/labels";
import { WOCHEN_REPORT } from "@/lib/mock/research";
import { useStore } from "@/lib/store";
import type { WatchedAccount, WochenReport } from "@/lib/types";

function ReportListe({ titel, punkte }: { titel: string; punkte: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{titel}</h3>
      <ul className="mt-2.5 space-y-2">
        {punkte.map((punkt) => (
          <li key={punkt} className="flex gap-2.5 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marke-500" />
            <span>{punkt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AccountsSeite() {
  const { accounts, accountsSetzen } = useStore();
  const [neuerHandle, setNeuerHandle] = useState("");
  const [neueBeschreibung, setNeueBeschreibung] = useState("");
  const [report, setReport] = useState<WochenReport | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  function hinzufuegen() {
    const bereinigt = neuerHandle.trim().replace(/^@/, "");
    if (!bereinigt) return;
    const handle = `@${bereinigt}`;
    if (accounts.some((account) => account.handle === handle)) {
      setNeuerHandle("");
      return;
    }
    const neu: WatchedAccount = {
      id: `acc-${Date.now().toString(36)}`,
      handle,
      beschreibung: neueBeschreibung.trim() || "Keine Beschreibung hinterlegt.",
      kategorie: "Neu",
      follower: 0,
      hinzugefuegtAm: new Date().toISOString(),
    };
    accountsSetzen([...accounts, neu]);
    setNeuerHandle("");
    setNeueBeschreibung("");
  }

  function entfernen(id: string) {
    accountsSetzen(accounts.filter((account) => account.id !== id));
  }

  function alleAnalysieren() {
    if (accounts.length === 0) return;
    setLaeuft(true);
    window.setTimeout(() => {
      const jetzt = new Date().toISOString();
      accountsSetzen(
        accounts.map((account) => ({ ...account, letzteAnalyse: jetzt })),
      );
      setReport({
        ...WOCHEN_REPORT,
        erstelltAm: jetzt,
        analysierteAccounts: accounts.length,
      });
      setLaeuft(false);
    }, 900);
  }

  return (
    <>
      <PageHeader
        titel="Beobachtete Accounts"
        beschreibung="Deine Vergleichsaccounts an einem Ort. Aus der Sammelanalyse entsteht ein Wochenreport mit Trends und Lücken."
        aktionen={
          <Button
            variante="primaer"
            onClick={alleAnalysieren}
            disabled={accounts.length === 0 || laeuft}
          >
            {laeuft ? "Analyse läuft …" : "Alle analysieren"}
          </Button>
        }
      />

      <Card>
        <CardHeader
          titel="Account hinzufügen"
          beschreibung="Handle eingeben, optional mit kurzer Notiz"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] sm:items-end">
            <div>
              <label
                htmlFor="neuer-handle"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Handle
              </label>
              <input
                id="neuer-handle"
                value={neuerHandle}
                onChange={(event) => setNeuerHandle(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && hinzufuegen()}
                placeholder="@studio.beispiel"
                className={eingabeKlassen}
              />
            </div>
            <div>
              <label
                htmlFor="neue-beschreibung"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Notiz (optional)
              </label>
              <input
                id="neue-beschreibung"
                value={neueBeschreibung}
                onChange={(event) => setNeueBeschreibung(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && hinzufuegen()}
                placeholder="Warum ist der Account interessant?"
                className={eingabeKlassen}
              />
            </div>
            <Button onClick={hinzufuegen} disabled={!neuerHandle.trim()}>
              Hinzufügen
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-5">
        {accounts.length === 0 ? (
          <EmptyState
            titel="Noch keine Accounts"
            beschreibung="Füge oben den ersten Instagram-Account hinzu, den du regelmäßig beobachten möchtest."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {account.handle}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {account.beschreibung}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => entfernen(account.id)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`${account.handle} entfernen`}
                  >
                    <IconMuell className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Tag>{account.kategorie}</Tag>
                  {account.follower > 0 && (
                    <Tag>{formatZahl(account.follower)} Follower</Tag>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Hinzugefügt am {formatDatum(account.hinzugefuegtAm)}
                  {account.letzteAnalyse &&
                    ` · zuletzt analysiert am ${formatDatum(account.letzteAnalyse)}`}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {report && (
        <Card className="mt-6">
          <CardHeader
            titel="Wochenreport"
            beschreibung={`${report.analysierteAccounts} Accounts ausgewertet am ${formatDatum(report.erstelltAm)}`}
          />
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ReportListe titel="Trends" punkte={report.trends} />
              <ReportListe
                titel="Erfolgreiche Themen"
                punkte={report.erfolgreicheThemen}
              />
              <ReportListe titel="Content-Lücken" punkte={report.contentLuecken} />
            </div>
            <div className="rounded-xl bg-marke-50 px-4 py-3.5 text-sm text-marke-900 ring-1 ring-inset ring-marke-200">
              <span className="font-semibold">Empfehlung: </span>
              {report.empfehlung}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
