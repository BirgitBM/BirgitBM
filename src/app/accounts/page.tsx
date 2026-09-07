"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, EmptyState, inputClass } from "@/components/ui";

export default function AccountsPage() {
  const { accounts, addAccount, removeAccount } = useStore();
  const [neuerHandle, setNeuerHandle] = useState("");
  const [report, setReport] = useState<null | {
    trends: string[];
    themen: string[];
    luecken: string[];
  }>(null);
  const [analysiere, setAnalysiere] = useState(false);

  const hinzufuegen = () => {
    const h = neuerHandle.trim();
    if (!h) return;
    addAccount(h.startsWith("@") ? h : `@${h}`);
    setNeuerHandle("");
  };

  const alleAnalysieren = () => {
    setAnalysiere(true);
    setTimeout(() => {
      setReport({
        trends: [
          "Erklärvideos zu Wirkmechanismen performen deutlich über Durchschnitt",
          "Kurze Vorher/Nachher-Formate mit Voiceover wiederholen sich bei allen beobachteten Accounts",
        ],
        themen: [
          "Behandlungsmythen aufklären",
          "Produktherkunft & Herstellung",
          "Alltag im Studio / Behind the Scenes",
        ],
        luecken: [
          "Kein Account adressiert Heilpraktiker als eigene Zielgruppe",
          "Preis-Einwände werden durchgehend vermieden statt beantwortet",
        ],
      });
      setAnalysiere(false);
    }, 600);
  };

  return (
    <div>
      <PageHeader
        title="Beobachtete Accounts"
        subtitle="Verwalte Accounts, die du regelmäßig für Content-Research im Blick behältst."
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={inputClass}
            placeholder="@account_hinzufuegen"
            value={neuerHandle}
            onChange={(e) => setNeuerHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hinzufuegen()}
          />
          <Button onClick={hinzufuegen} disabled={!neuerHandle.trim()}>
            Account hinzufügen
          </Button>
        </div>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState text="Noch keine Accounts gespeichert." />
      ) : (
        <Card className="mb-6 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-taupe border-b border-line">
                <th className="font-medium px-5 py-3">Account</th>
                <th className="font-medium px-5 py-3">Hinzugefügt am</th>
                <th className="font-medium px-5 py-3">Letzte Analyse</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium">{a.handle}</td>
                  <td className="px-5 py-3 text-taupe">{a.hinzugefuegtAm}</td>
                  <td className="px-5 py-3 text-taupe">{a.letzteAnalyse ?? "–"}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeAccount(a.id)}
                      className="text-taupe hover:text-[var(--red)] text-xs"
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mb-6">
        <Button onClick={alleAnalysieren} disabled={accounts.length === 0 || analysiere}>
          {analysiere ? "Analysiere alle …" : "Alle analysieren"}
        </Button>
      </div>

      {report && (
        <Card>
          <div className="font-display text-xl mb-4">Wochenreport</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-taupe mb-2">Trends</div>
              <ul className="space-y-1.5 text-sm">
                {report.trends.map((t, i) => <li key={i}>– {t}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-taupe mb-2">Erfolgreiche Themen</div>
              <ul className="space-y-1.5 text-sm">
                {report.themen.map((t, i) => <li key={i}>– {t}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--amber)] mb-2">Content-Lücken</div>
              <ul className="space-y-1.5 text-sm">
                {report.luecken.map((t, i) => <li key={i}>– {t}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
