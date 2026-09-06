import type {
  BrandKnowledge,
  BrollClip,
  ContentItem,
  PlanEntry,
  SavedHook,
  WatchedAccount,
} from "../types";

/**
 * Datenzugriff hinter einer Schnittstelle.
 *
 * Die gesamte Oberfläche spricht nur mit diesem Vertrag. Für Version 1 liegt
 * dahinter `MockRepository` (Mock-Daten + Browser-Speicher). Für die
 * Supabase-Anbindung wird später eine zweite Implementierung ergänzt, die
 * dieselben Methoden gegen die Datenbank ausführt – die Komponenten bleiben
 * unverändert.
 */
export interface ContentRepository {
  /** Lädt den gesamten Bestand. Die Filterung nach Marke passiert in der Oberfläche. */
  ladeAlles(): Promise<DatenBestand>;
  speichereContent(item: ContentItem): Promise<void>;
  loescheContent(id: string): Promise<void>;
  speicherePlan(eintraege: PlanEntry[]): Promise<void>;
  speichereAccounts(accounts: WatchedAccount[]): Promise<void>;
  speichereHooks(hooks: SavedHook[]): Promise<void>;
  speichereMarkenwissen(wissen: BrandKnowledge): Promise<void>;
}

export interface DatenBestand {
  content: ContentItem[];
  broll: BrollClip[];
  plan: PlanEntry[];
  accounts: WatchedAccount[];
  hooks: SavedHook[];
  wissen: BrandKnowledge[];
}
