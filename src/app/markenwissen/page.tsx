"use client";

import { useStore } from "@/lib/store";
import { Card, PageHeader } from "@/components/ui";

export default function MarkenwissenPage() {
  const { markenwissen } = useStore();
  return (
    <div>
      <PageHeader
        title="Markenwissen"
        subtitle="Interne Referenz für Zielgruppe, Tonalität und Produkte je Marke."
      />

      <div className="space-y-4">
        {markenwissen.map((m) => (
          <Card key={m.marke}>
            <div className="font-display text-xl mb-4">{m.marke}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-medium text-taupe mb-1">Zielgruppe</div>
                <p>{m.zielgruppe}</p>
              </div>
              <div>
                <div className="font-medium text-taupe mb-1">Tonalität</div>
                <p>{m.tonalitaet}</p>
              </div>
              <div>
                <div className="font-medium text-taupe mb-1">Produkte</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.produkte.map((p) => (
                    <span key={p} className="text-xs bg-ivory border border-line rounded-full px-2 py-0.5">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-sm text-taupe mt-6">
        Weitere Marken (SQT Homecare, Exoprime, Haut Zentrum) können hier nach demselben Schema ergänzt werden.
      </p>
    </div>
  );
}
