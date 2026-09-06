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
