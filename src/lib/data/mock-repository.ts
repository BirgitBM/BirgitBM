import { BROLL_CLIPS } from "../mock/broll";
import { CONTENT_ITEMS } from "../mock/content";
import { GESPEICHERTE_HOOKS } from "../mock/hooks";
import { MARKENWISSEN } from "../mock/knowledge";
import { PLAN_ENTRIES } from "../mock/plan";
import { BEOBACHTETE_ACCOUNTS } from "../mock/research";
import type {
  BrandKnowledge,
  BrollClip,
  BrollZuordnung,
  ContentItem,
  PlanEntry,
  SavedHook,
  WatchedAccount,
} from "../types";
import type { ContentRepository, DatenBestand } from "./repository";

const SPEICHER_SCHLUESSEL = "contentos";

/**
 * Fassung des gespeicherten Datenbestands.
 *
 * Wird das Datenmodell erweitert, erhöht sich diese Zahl. Beim Laden wird dann
 * erkannt, dass die Daten im Browser aus einer älteren Fassung stammen, und die
 * Beispieldaten werden neu geladen. Ohne diese Prüfung fehlten neuen Feldern
 * still ihre Werte – der häufigste Grund für schwer auffindbare Fehler nach
 * einem Update.
 */
const SPEICHER_FASSUNG = 3;

/**
 * Version-1-Implementierung: Mock-Daten als Startbestand, Änderungen bleiben
 * im Browser (localStorage) erhalten. Kein Server, keine externe API.
 */
export class MockRepository implements ContentRepository {
  private bestand: DatenBestand | null = null;

  private startbestand(): DatenBestand {
    return {
      content: structuredClone(CONTENT_ITEMS),
      broll: structuredClone(BROLL_CLIPS),
      plan: structuredClone(PLAN_ENTRIES),
      accounts: structuredClone(BEOBACHTETE_ACCOUNTS),
      hooks: structuredClone(GESPEICHERTE_HOOKS),
      wissen: structuredClone(MARKENWISSEN),
      zuordnungen: [],
    };
  }

  private laden(): DatenBestand {
    if (this.bestand) return this.bestand;

    if (typeof window === "undefined") {
      this.bestand = this.startbestand();
      return this.bestand;
    }

    try {
      const roh = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (roh) {
        const gespeichert = JSON.parse(roh) as Partial<DatenBestand> & {
          fassung?: number;
        };
        if (gespeichert.fassung !== SPEICHER_FASSUNG) {
          // Ältere Fassung im Browser: bewusst verwerfen und mit den
          // aktuellen Beispieldaten neu starten.
          this.bestand = this.startbestand();
          this.sichern();
          return this.bestand;
        }
        const start = this.startbestand();
        this.bestand = {
          content: gespeichert.content ?? start.content,
          broll: gespeichert.broll ?? start.broll,
          plan: gespeichert.plan ?? start.plan,
          accounts: gespeichert.accounts ?? start.accounts,
          hooks: gespeichert.hooks ?? start.hooks,
          wissen: gespeichert.wissen ?? start.wissen,
          zuordnungen: gespeichert.zuordnungen ?? start.zuordnungen,
        };
        return this.bestand;
      }
    } catch {
      // Beschädigter Speicher: still auf die Mock-Daten zurückfallen.
    }

    this.bestand = this.startbestand();
    return this.bestand;
  }

  private sichern(): void {
    if (typeof window === "undefined" || !this.bestand) return;
    try {
      window.localStorage.setItem(
        SPEICHER_SCHLUESSEL,
        JSON.stringify({ ...this.bestand, fassung: SPEICHER_FASSUNG }),
      );
    } catch {
      // Speicher voll oder blockiert – die App funktioniert weiter.
    }
  }

  async ladeAlles(): Promise<DatenBestand> {
    const alles = this.laden();
    return {
      content: alles.content,
      // B-Roll wird bewusst markenübergreifend geführt: dieselben Clips
      // lassen sich für SQT B2B und Homecare verwenden.
      broll: alles.broll,
      plan: alles.plan,
      accounts: alles.accounts,
      hooks: alles.hooks,
      wissen: alles.wissen,
      zuordnungen: alles.zuordnungen,
    };
  }

  async speichereBroll(clip: BrollClip): Promise<void> {
    const alles = this.laden();
    const index = alles.broll.findIndex((vorhanden) => vorhanden.id === clip.id);
    if (index >= 0) alles.broll[index] = clip;
    else alles.broll.unshift(clip);
    this.sichern();
  }

  async loescheBroll(id: string): Promise<void> {
    const alles = this.laden();
    alles.broll = alles.broll.filter((clip) => clip.id !== id);
    this.bestand = alles;
    this.sichern();
  }

  async speichereZuordnung(zuordnung: BrollZuordnung): Promise<void> {
    const alles = this.laden();
    const index = alles.zuordnungen.findIndex(
      (vorhanden) =>
        vorhanden.userId === zuordnung.userId &&
        vorhanden.contentId === zuordnung.contentId,
    );
    if (index >= 0) alles.zuordnungen[index] = zuordnung;
    else alles.zuordnungen.push(zuordnung);
    this.bestand = alles;
    this.sichern();
  }

  async speichereContent(item: ContentItem): Promise<void> {
    const alles = this.laden();
    const index = alles.content.findIndex((vorhanden) => vorhanden.id === item.id);
    if (index >= 0) alles.content[index] = item;
    else alles.content.unshift(item);
    this.sichern();
  }

  async loescheContent(id: string): Promise<void> {
    const alles = this.laden();
    alles.content = alles.content.filter((eintrag) => eintrag.id !== id);
    this.bestand = alles;
    this.sichern();
  }

  async speicherePlan(eintraege: PlanEntry[]): Promise<void> {
    const alles = this.laden();
    const brandIds = new Set(eintraege.map((eintrag) => eintrag.brandId));
    alles.plan = [
      ...alles.plan.filter((eintrag) => !brandIds.has(eintrag.brandId)),
      ...eintraege,
    ];
    this.bestand = alles;
    this.sichern();
  }

  async speichereAccounts(accounts: WatchedAccount[]): Promise<void> {
    const alles = this.laden();
    alles.accounts = accounts;
    this.bestand = alles;
    this.sichern();
  }

  async speichereHooks(hooks: SavedHook[]): Promise<void> {
    const alles = this.laden();
    const brandIds = new Set(hooks.map((hook) => hook.brandId));
    alles.hooks = [
      ...alles.hooks.filter((hook) => !brandIds.has(hook.brandId)),
      ...hooks,
    ];
    this.bestand = alles;
    this.sichern();
  }

  async speichereMarkenwissen(wissen: BrandKnowledge): Promise<void> {
    const alles = this.laden();
    const index = alles.wissen.findIndex(
      (eintrag) => eintrag.brandId === wissen.brandId,
    );
    if (index >= 0) alles.wissen[index] = wissen;
    else alles.wissen.push(wissen);
    this.bestand = alles;
    this.sichern();
  }

  /** Setzt den Browser-Speicher zurück auf die Beispieldaten. */
  zuruecksetzen(): void {
    this.bestand = this.startbestand();
    this.sichern();
  }
}

export const repository = new MockRepository();
