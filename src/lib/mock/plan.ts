import type { PlanEntry } from "../types";
import { kalenderwocheVon } from "../week";

/**
 * Die Beispielwoche ist bewusst die laufende Kalenderwoche, damit der
 * Wochenplan beim Öffnen immer zum heutigen Datum passt. Später kommt die
 * Kalenderwoche aus der Datenbank.
 */
export const AKTUELLE_KALENDERWOCHE = kalenderwocheVon();

export const PLAN_ENTRIES: PlanEntry[] = [
  {
    id: "plan-001",
    brandId: "sqt-b2b",
    kalenderwoche: AKTUELLE_KALENDERWOCHE,
    tag: "Montag",
    contentId: "content-003",
    thema: "„Meine Kundinnen kaufen keine Pflege für zuhause“",
    goal: "einwand",
    status: "freigegeben",
    brollIds: ["broll-b007"],
    uhrzeit: "11:00",
  },
  {
    id: "plan-002",
    brandId: "sqt-b2b",
    kalenderwoche: AKTUELLE_KALENDERWOCHE,
    tag: "Dienstag",
    contentId: "content-001",
    thema: "Hautbarriere vor Wirkstoff",
    goal: "education",
    status: "produziert",
    brollIds: ["broll-b006", "broll-b003"],
    uhrzeit: "10:00",
  },
  {
    id: "plan-003",
    brandId: "sqt-b2b",
    kalenderwoche: AKTUELLE_KALENDERWOCHE,
    tag: "Mittwoch",
    contentId: "content-002",
    thema: "Radiance Set im Studio platzieren",
    goal: "produktverkauf",
    status: "entwurf",
    brollIds: ["broll-b005", "broll-b001"],
    uhrzeit: "17:30",
  },
  {
    id: "plan-004",
    brandId: "sqt-b2b",
    kalenderwoche: AKTUELLE_KALENDERWOCHE,
    tag: "Donnerstag",
    thema: "Behandlungsablauf in 20 Sekunden erklärt",
    goal: "education",
    status: "idee",
    brollIds: ["broll-b004"],
    uhrzeit: "12:00",
  },
  {
    id: "plan-005",
    brandId: "sqt-b2b",
    kalenderwoche: AKTUELLE_KALENDERWOCHE,
    tag: "Freitag",
    contentId: "content-004",
    thema: "3 Fehler bei der Ampullen-Anwendung",
    goal: "reichweite",
    status: "entwurf",
    brollIds: ["broll-b003", "broll-b008"],
    uhrzeit: "18:00",
  },
];
