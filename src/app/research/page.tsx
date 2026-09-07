"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PageHeader, Button, Field, inputClass } from "@/components/ui";
import { instagramAnalyseMock } from "@/lib/mockData";
import { InstagramAnalyse } from "@/lib/types";
import { useStore } from "@/lib/store";

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-charcoal">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-taupe">–</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResearchPage() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyse, setAnalyse] = useState<InstagramAnalyse | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const { addAccount } = useStore();
  const router = useRouter();

  const analysieren = () => {
    if (!handle.trim()) return;
    setLoading(true);
    setSaved(null);
    setTimeout(() => {
      setAnalyse(instagramAnalyseMock(handle.trim()));
      setLoading(false);
    }, 500);
  };

  return (
    <div>
      <PageHeader
        title="Research"
        subtitle="Analysiere einen Instagram-Account und leite Content-Chancen für SQT ab."
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Field label="Instagram-Account">
              <input
                className={inputClass}
                placeholder="@account_name"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analysieren()}
              />
            </Field>
          </div>
          <Button onClick={analysieren} disabled={!handle.trim() || loading}>
            {loading ? "Analysiere …" : "Account analysieren"}
          </Button>
        </div>
      </Card>

      {analyse && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="text-sm font-medium text-taupe mb-3">Erfolgreichste Themen</div>
              <List items={analyse.erfolgreichsteThemen} />
            </Card>
            <Card>
              <div className="text-sm font-medium text-taupe mb-3">Häufigste Hooks</div>
              <List items={analyse.haeufigsteHooks} />
            </Card>
            <Card>
              <div className="text-sm font-medium text-taupe mb-3">Erfolgreichste Reels</div>
              <ul className="space-y-2 text-sm">
                {analyse.erfolgreichsteReels.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{r.titel}</span>
                    <span className="text-taupe shrink-0">{r.kennzahl}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="text-sm font-medium text-taupe mb-3">Posting-Frequenz</div>
              <p className="text-sm">{analyse.postingFrequenz}</p>
              <div className="text-sm font-medium text-taupe mt-4 mb-2">Verwendete CTAs</div>
              <List items={analyse.verwendeteCtas} />
            </Card>
            <Card>
              <div className="text-sm font-medium text-taupe mb-3">Wiederkehrende Formate</div>
              <List items={analyse.wiederkehrendeFormate} />
            </Card>
            <Card className="border-gold/60">
              <div className="text-sm font-medium text-[var(--amber)] mb-3">Content-Chancen für SQT</div>
              <List items={analyse.contentChancenFuerSqt} />
            </Card>
          </div>

          <Card>
            <div className="text-sm font-medium text-taupe mb-3">Mögliche Content-Lücken</div>
            <List items={analyse.contentLuecken} />
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push("/content-erstellen")}>
              10 Ideen für SQT erstellen
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSaved("Hooks wurden in der Bibliothek vermerkt (Mock-Aktion).")}
            >
              Erfolgreiche Hooks speichern
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                addAccount(analyse.account);
                setSaved(`${analyse.account} wird jetzt beobachtet.`);
              }}
            >
              Account beobachten
            </Button>
          </div>
          {saved && <p className="text-sm text-[var(--green)]">{saved}</p>}
        </div>
      )}
    </div>
  );
}
