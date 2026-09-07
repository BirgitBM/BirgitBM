"use client";

import { useStore } from "@/lib/store";
import { Card, PageHeader } from "@/components/ui";

export default function BRollPage() {
  const { broll } = useStore();

  return (
    <div>
      <PageHeader
        title="B-Roll-Bibliothek"
        subtitle="Kurze Videoclips, die Reels und dem Wochenplan zugeordnet werden können."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {broll.map((clip) => (
          <Card key={clip.id} className="p-0 overflow-hidden">
            <div className="aspect-video bg-blush flex items-center justify-center text-taupe text-sm">
              Vorschau-Platzhalter
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-taupe">{clip.id}</span>
                <span className="text-xs text-taupe">{clip.kategorie}</span>
              </div>
              <div className="font-medium">{clip.titel}</div>
              <p className="text-sm text-taupe mt-1">{clip.beschreibung}</p>
              {clip.produkt && (
                <div className="text-xs text-taupe mt-2">Produkt: {clip.produkt}</div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {clip.tags.map((t) => (
                  <span key={t} className="text-xs bg-ivory border border-line rounded-full px-2 py-0.5 text-taupe">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
