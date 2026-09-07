"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AKTUELLER_BENUTZER, darfInhaltSehen, rechteFuer } from "./auth";
import { repository } from "./data/mock-repository";
import { MARKEN, STANDARD_MARKE } from "./mock/brands";
import { AKTUELLE_KALENDERWOCHE } from "./mock/plan";
import type {
  AppUser,
  BrandKnowledge,
  BrollClip,
  BrollZuordnung,
  ContentItem,
  PlanEntry,
  SavedHook,
  UserRole,
  WatchedAccount,
} from "./types";

interface StoreWert {
  bereit: boolean;
  benutzer: AppUser;
  rolleWechseln: (rolle: UserRole) => void;
  rechte: ReturnType<typeof rechteFuer>;

  markeId: string;
  markeWechseln: (id: string) => void;
  marken: typeof MARKEN;

  /** Inhalte der aktiven Marke, bereits nach Rolle gefiltert. */
  content: ContentItem[];
  /** Inhalte aller zugänglichen Marken – für die Content-Bibliothek. */
  contentAlleMarken: ContentItem[];
  broll: BrollClip[];
  plan: PlanEntry[];
  accounts: WatchedAccount[];
  hooks: SavedHook[];
  wissen: BrandKnowledge | undefined;

  contentSpeichern: (item: ContentItem) => void;
  contentLoeschen: (id: string) => void;
  brollSpeichern: (clip: BrollClip) => void;
  brollLoeschen: (id: string) => void;
  /** Welche Clips gelten für diesen Inhalt – je nach Rolle eigene oder die der Marke. */
  brollIdsFuer: (item: ContentItem) => string[];
  /** Clips zuordnen. Als Kundin wird eine eigene Zuordnung gespeichert. */
  brollZuordnen: (item: ContentItem, brollIds: string[]) => void;
  planSetzen: (eintraege: PlanEntry[]) => void;
  accountsSetzen: (accounts: WatchedAccount[]) => void;
  hooksSetzen: (hooks: SavedHook[]) => void;
  wissenSpeichern: (wissen: BrandKnowledge) => void;
  kalenderwoche: string;
}

const StoreContext = createContext<StoreWert | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [bereit, setBereit] = useState(false);
  const [benutzer, setBenutzer] = useState<AppUser>(AKTUELLER_BENUTZER);
  const [markeId, setMarkeId] = useState<string>(STANDARD_MARKE);

  const [content, setContent] = useState<ContentItem[]>([]);
  const [broll, setBroll] = useState<BrollClip[]>([]);
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [accounts, setAccounts] = useState<WatchedAccount[]>([]);
  const [hooks, setHooks] = useState<SavedHook[]>([]);
  const [wissenListe, setWissenListe] = useState<BrandKnowledge[]>([]);
  const [zuordnungen, setZuordnungen] = useState<BrollZuordnung[]>([]);

  // Einmaliges Laden des Gesamtbestands. Die Filterung nach Marke passiert
  // unten im Speicher – so bleibt der Markenwechsel ohne Ladezeit.
  useEffect(() => {
    let abgebrochen = false;
    repository.ladeAlles().then((bestand) => {
      if (abgebrochen) return;
      setContent(bestand.content);
      setBroll(bestand.broll);
      setPlan(bestand.plan);
      setAccounts(bestand.accounts);
      setHooks(bestand.hooks);
      setWissenListe(bestand.wissen);
      setZuordnungen(bestand.zuordnungen);
      setBereit(true);
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  const contentSpeichern = useCallback((item: ContentItem) => {
    setContent((bisher) => {
      const index = bisher.findIndex((eintrag) => eintrag.id === item.id);
      if (index >= 0) {
        const kopie = [...bisher];
        kopie[index] = item;
        return kopie;
      }
      return [item, ...bisher];
    });
    void repository.speichereContent(item);
  }, []);

  const contentLoeschen = useCallback((id: string) => {
    setContent((bisher) => bisher.filter((eintrag) => eintrag.id !== id));
    void repository.loescheContent(id);
  }, []);

  /** Ersetzt den Plan der aktiven Marke; andere Marken bleiben unberührt. */
  const brollSpeichern = useCallback((clip: BrollClip) => {
    setBroll((bisher) => {
      const index = bisher.findIndex((vorhanden) => vorhanden.id === clip.id);
      if (index >= 0) {
        const kopie = [...bisher];
        kopie[index] = clip;
        return kopie;
      }
      return [clip, ...bisher];
    });
    void repository.speichereBroll(clip);
  }, []);

  const brollLoeschen = useCallback((id: string) => {
    setBroll((bisher) => bisher.filter((clip) => clip.id !== id));
    void repository.loescheBroll(id);
  }, []);

  const planSetzen = useCallback(
    (eintraege: PlanEntry[]) => {
      setPlan((bisher) => [
        ...bisher.filter((eintrag) => eintrag.brandId !== markeId),
        ...eintraege,
      ]);
      void repository.speicherePlan(eintraege);
    },
    [markeId],
  );

  const accountsSetzen = useCallback((neu: WatchedAccount[]) => {
    setAccounts(neu);
    void repository.speichereAccounts(neu);
  }, []);

  const hooksSetzen = useCallback(
    (neu: SavedHook[]) => {
      setHooks((bisher) => [
        ...bisher.filter((hook) => hook.brandId !== markeId),
        ...neu,
      ]);
      void repository.speichereHooks(neu);
    },
    [markeId],
  );

  const wissenSpeichern = useCallback((neu: BrandKnowledge) => {
    setWissenListe((bisher) => {
      const index = bisher.findIndex((eintrag) => eintrag.brandId === neu.brandId);
      if (index >= 0) {
        const kopie = [...bisher];
        kopie[index] = neu;
        return kopie;
      }
      return [...bisher, neu];
    });
    void repository.speichereMarkenwissen(neu);
  }, []);

  /**
   * Kundinnen teilen sich denselben Inhalt, verwenden aber eigene Clips.
   * Für sie zählt die persönliche Zuordnung, für Admins der Inhalt selbst.
   */
  const brollIdsFuer = useCallback(
    (item: ContentItem) => {
      if (benutzer.role === "admin") return item.brollIds;
      const eigene = zuordnungen.find(
        (eintrag) =>
          eintrag.userId === benutzer.id && eintrag.contentId === item.id,
      );
      return eigene ? eigene.brollIds : item.brollIds;
    },
    [benutzer.id, benutzer.role, zuordnungen],
  );

  const brollZuordnen = useCallback(
    (item: ContentItem, brollIds: string[]) => {
      if (benutzer.role === "admin") {
        const aktualisiert = {
          ...item,
          brollIds,
          updatedAt: new Date().toISOString(),
        };
        setContent((bisher) =>
          bisher.map((eintrag) =>
            eintrag.id === item.id ? aktualisiert : eintrag,
          ),
        );
        void repository.speichereContent(aktualisiert);
        return;
      }
      const zuordnung: BrollZuordnung = {
        id: `zuordnung-${benutzer.id}-${item.id}`,
        userId: benutzer.id,
        contentId: item.id,
        brollIds,
        updatedAt: new Date().toISOString(),
      };
      setZuordnungen((bisher) => [
        ...bisher.filter(
          (eintrag) =>
            !(eintrag.userId === zuordnung.userId &&
              eintrag.contentId === zuordnung.contentId),
        ),
        zuordnung,
      ]);
      void repository.speichereZuordnung(zuordnung);
    },
    [benutzer.id, benutzer.role],
  );

  const rolleWechseln = useCallback((rolle: UserRole) => {
    setBenutzer((bisher) => ({ ...bisher, role: rolle }));
  }, []);

  const sichtbarerContent = useMemo(
    () => content.filter((eintrag) => darfInhaltSehen(benutzer, eintrag)),
    [content, benutzer],
  );

  const contentDerMarke = useMemo(
    () => sichtbarerContent.filter((eintrag) => eintrag.brandId === markeId),
    [sichtbarerContent, markeId],
  );

  const planDerMarke = useMemo(
    () => plan.filter((eintrag) => eintrag.brandId === markeId),
    [plan, markeId],
  );

  const hooksDerMarke = useMemo(
    () => hooks.filter((hook) => hook.brandId === markeId),
    [hooks, markeId],
  );

  const wert = useMemo<StoreWert>(
    () => ({
      bereit,
      benutzer,
      rolleWechseln,
      rechte: rechteFuer(benutzer.role),
      markeId,
      markeWechseln: setMarkeId,
      marken: MARKEN,
      content: contentDerMarke,
      contentAlleMarken: sichtbarerContent,
      broll,
      plan: planDerMarke,
      accounts,
      hooks: hooksDerMarke,
      wissen: wissenListe.find((eintrag) => eintrag.brandId === markeId),
      contentSpeichern,
      contentLoeschen,
      brollSpeichern,
      brollLoeschen,
      brollIdsFuer,
      brollZuordnen,
      planSetzen,
      accountsSetzen,
      hooksSetzen,
      wissenSpeichern,
      kalenderwoche: AKTUELLE_KALENDERWOCHE,
    }),
    [
      bereit,
      benutzer,
      rolleWechseln,
      markeId,
      sichtbarerContent,
      contentDerMarke,
      broll,
      planDerMarke,
      accounts,
      hooksDerMarke,
      wissenListe,
      contentSpeichern,
      contentLoeschen,
      brollSpeichern,
      brollLoeschen,
      brollIdsFuer,
      brollZuordnen,
      planSetzen,
      accountsSetzen,
      hooksSetzen,
      wissenSpeichern,
    ],
  );

  return <StoreContext.Provider value={wert}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreWert {
  const wert = useContext(StoreContext);
  if (!wert) {
    throw new Error("useStore muss innerhalb von StoreProvider verwendet werden.");
  }
  return wert;
}
