"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabaseClient";
import {
  BeobachteterAccount,
  BRollClip,
  MarkeninfoEintrag,
  ReelCard,
  WochenplanEintrag,
} from "./types";
import {
  dbToAccount,
  dbToBroll,
  dbToMarkeninfo,
  dbToReel,
  dbToWochenplan,
  reelToDb,
  wochenplanToDb,
} from "./mappers";

interface StoreContextValue {
  reels: ReelCard[];
  broll: BRollClip[];
  accounts: BeobachteterAccount[];
  wochenplan: WochenplanEintrag[];
  markenwissen: MarkeninfoEintrag[];
  loading: boolean;
  error: string | null;
  addReel: (reel: ReelCard) => Promise<void>;
  updateReel: (id: string, patch: Partial<ReelCard>) => Promise<void>;
  addAccount: (handle: string) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addWochenplanEintraege: (eintraege: WochenplanEintrag[]) => Promise<void>;
  updateWochenplanEintrag: (id: string, patch: Partial<WochenplanEintrag>) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reels, setReels] = useState<ReelCard[]>([]);
  const [broll, setBroll] = useState<BRollClip[]>([]);
  const [accounts, setAccounts] = useState<BeobachteterAccount[]>([]);
  const [wochenplan, setWochenplan] = useState<WochenplanEintrag[]>([]);
  const [markenwissen, setMarkenwissen] = useState<MarkeninfoEintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ladeAlles() {
      setLoading(true);
      setError(null);
      const [reelsRes, brollRes, accountsRes, wochenplanRes, markenwissenRes] = await Promise.all([
        supabase.from("reels").select("*").order("erstellt_am", { ascending: false }),
        supabase.from("broll").select("*").order("id"),
        supabase.from("accounts").select("*").order("hinzugefuegt_am", { ascending: false }),
        supabase.from("wochenplan").select("*").order("id"),
        supabase.from("markenwissen").select("*"),
      ]);

      if (cancelled) return;

      const ersterFehler =
        reelsRes.error || brollRes.error || accountsRes.error || wochenplanRes.error || markenwissenRes.error;
      if (ersterFehler) {
        setError(
          `Verbindung zu Supabase fehlgeschlagen: ${ersterFehler.message}. Prüfe .env.local und ob supabase/schema.sql bereits ausgeführt wurde.`
        );
        setLoading(false);
        return;
      }

      setReels((reelsRes.data ?? []).map(dbToReel));
      setBroll((brollRes.data ?? []).map(dbToBroll));
      setAccounts((accountsRes.data ?? []).map(dbToAccount));
      setWochenplan((wochenplanRes.data ?? []).map(dbToWochenplan));
      setMarkenwissen((markenwissenRes.data ?? []).map(dbToMarkeninfo));
      setLoading(false);
    }

    ladeAlles();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addReel(reel: ReelCard) {
    setReels((r) => [reel, ...r]); // optimistisch
    const { error: err } = await supabase.from("reels").insert(reelToDb(reel));
    if (err) {
      setError(`Reel konnte nicht gespeichert werden: ${err.message}`);
      setReels((r) => r.filter((x) => x.id !== reel.id)); // zurückrollen
    }
  }

  async function updateReel(id: string, patch: Partial<ReelCard>) {
    setReels((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const dbPatch: Record<string, unknown> = {};
    if (patch.hook !== undefined) dbPatch.hook = patch.hook;
    if (patch.caption !== undefined) dbPatch.caption = patch.caption;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.cta !== undefined) dbPatch.cta = patch.cta;
    if (patch.freigegebenFuerKunden !== undefined) dbPatch.freigegeben_fuer_kunden = patch.freigegebenFuerKunden;
    const { error: err } = await supabase.from("reels").update(dbPatch).eq("id", id);
    if (err) setError(`Änderung am Reel konnte nicht gespeichert werden: ${err.message}`);
  }

  async function addAccount(handle: string) {
    const id = `A${Date.now()}`;
    const neu: BeobachteterAccount = { id, handle, hinzugefuegtAm: new Date().toISOString().slice(0, 10) };
    setAccounts((a) => [neu, ...a]);
    const { error: err } = await supabase.from("accounts").insert({
      id: neu.id,
      handle: neu.handle,
      hinzugefuegt_am: neu.hinzugefuegtAm,
    });
    if (err) {
      setError(`Account konnte nicht gespeichert werden: ${err.message}`);
      setAccounts((a) => a.filter((x) => x.id !== id));
    }
  }

  async function removeAccount(id: string) {
    const vorher = accounts;
    setAccounts((a) => a.filter((x) => x.id !== id));
    const { error: err } = await supabase.from("accounts").delete().eq("id", id);
    if (err) {
      setError(`Account konnte nicht entfernt werden: ${err.message}`);
      setAccounts(vorher);
    }
  }

  async function addWochenplanEintraege(eintraege: WochenplanEintrag[]) {
    const vorher = wochenplan;
    setWochenplan(eintraege);
    const alteIds = vorher.map((w) => w.id);
    if (alteIds.length > 0) {
      const { error: delErr } = await supabase.from("wochenplan").delete().in("id", alteIds);
      if (delErr) {
        setError(`Wochenplan konnte nicht zurückgesetzt werden: ${delErr.message}`);
        setWochenplan(vorher);
        return;
      }
    }
    const { error: insErr } = await supabase.from("wochenplan").insert(eintraege.map(wochenplanToDb));
    if (insErr) {
      setError(`Neuer Wochenplan konnte nicht gespeichert werden: ${insErr.message}`);
      setWochenplan(vorher);
    }
  }

  async function updateWochenplanEintrag(id: string, patch: Partial<WochenplanEintrag>) {
    setWochenplan((w) => w.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.thema !== undefined) dbPatch.thema = patch.thema;
    if (patch.brollId !== undefined) dbPatch.broll_id = patch.brollId;
    if (patch.reelId !== undefined) dbPatch.reel_id = patch.reelId;
    const { error: err } = await supabase.from("wochenplan").update(dbPatch).eq("id", id);
    if (err) setError(`Wochenplan-Eintrag konnte nicht gespeichert werden: ${err.message}`);
  }

  return (
    <StoreContext.Provider
      value={{
        reels,
        broll,
        accounts,
        wochenplan,
        markenwissen,
        loading,
        error,
        addReel,
        updateReel,
        addAccount,
        removeAccount,
        addWochenplanEintraege,
        updateWochenplanEintrag,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore muss innerhalb von StoreProvider verwendet werden");
  return ctx;
}
