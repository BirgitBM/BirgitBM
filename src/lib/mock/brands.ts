import type { Brand } from "../types";

/**
 * Marken sind bereits als eigene Entität modelliert, obwohl aktuell nur SQT
 * aktiv befüllt ist. So lassen sich weitere Marken ohne Umbau ergänzen.
 */
export const MARKEN: Brand[] = [
  {
    id: "sqt-b2b",
    slug: "sqt-b2b",
    name: "SQT B2B",
    organisation: "BM Colours",
    accentColor: "#0f766e",
    active: true,
  },
  {
    id: "sqt-homecare",
    slug: "sqt-homecare",
    name: "SQT Homecare",
    organisation: "BM Colours",
    accentColor: "#7c3aed",
    active: true,
  },
  {
    id: "exoprime",
    slug: "exoprime",
    name: "Exoprime",
    organisation: "BM Colours",
    accentColor: "#0369a1",
    active: true,
  },
  {
    id: "haut-zentrum",
    slug: "haut-zentrum",
    name: "Haut Zentrum",
    organisation: "BM Colours",
    accentColor: "#b45309",
    active: true,
  },
];

export const STANDARD_MARKE = "sqt-b2b";

export function markeFinden(id: string): Brand | undefined {
  return MARKEN.find((marke) => marke.id === id);
}
