import type { BrandKnowledge } from "../types";

/**
 * Markenwissen pro Marke. Die Struktur ist absichtlich flach gehalten,
 * damit sie später als JSON-Spalte oder eigene Tabelle in Supabase liegt.
 */
export const MARKENWISSEN: BrandKnowledge[] = [
  {
    brandId: "sqt-b2b",
    zielgruppe: "Kosmetikerinnen, Heilpraktiker und Ärzte",
    tonalitaet: ["professionell", "verständlich", "modern", "nicht übertrieben"],
    produkte: [
      {
        name: "Nourishing",
        kurzbeschreibung: "Aufbauende Pflege für trockene und beanspruchte Haut.",
        zielgruppe: ["kosmetikerinnen", "endkunden"],
      },
      {
        name: "Revitalizing",
        kurzbeschreibung: "Aktivierende Pflege für müde, fahle Haut.",
        zielgruppe: ["kosmetikerinnen"],
      },
      {
        name: "Anti-Aging",
        kurzbeschreibung: "Pflege mit Fokus auf Festigkeit und Faltentiefe.",
        zielgruppe: ["kosmetikerinnen", "endkunden"],
      },
      {
        name: "Recovery",
        kurzbeschreibung: "Beruhigung und Barriereaufbau nach Behandlungen.",
        zielgruppe: ["kosmetikerinnen"],
      },
      {
        name: "Body",
        kurzbeschreibung: "Körperpflege als Ergänzung zur Gesichtsbehandlung.",
        zielgruppe: ["endkunden"],
      },
      {
        name: "Radiance",
        kurzbeschreibung: "Ausstrahlung und gleichmäßiges Hautbild.",
        zielgruppe: ["kosmetikerinnen", "endkunden"],
      },
      {
        name: "Refine",
        kurzbeschreibung: "Verfeinerung von Poren und Hautstruktur.",
        zielgruppe: ["kosmetikerinnen"],
      },
    ],
    kernbotschaften: [
      "Fachlich fundiert, ohne Versprechen, die die Haut nicht halten kann.",
      "Behandlung und Homecare gehören zusammen.",
      "Die Kosmetikerin bleibt die Fachperson – wir liefern Werkzeug und Wissen.",
    ],
    woerterVermeiden: [
      "Wundermittel",
      "sofortiger Effekt",
      "Faltenkiller",
      "100 % garantiert",
    ],
    standardCtas: [
      "Schreib mir eine Nachricht für das Behandlungsprotokoll.",
      "Speichere dir den Beitrag für deine nächste Behandlung.",
      "Melde dich für die nächste Schulung an.",
    ],
    notizen:
      "Keine Heilversprechen. Bei Ärzten und Heilpraktikern sachlicher formulieren als bei Kosmetikerinnen.",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
];

export function markenwissenFinden(brandId: string): BrandKnowledge | undefined {
  return MARKENWISSEN.find((eintrag) => eintrag.brandId === brandId);
}
