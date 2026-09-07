"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, supabaseKonfiguriert } from "./supabaseClient";
import {
  BeobachteterAccount,
  BRollClip,
  BRollZuordnung,
  MarkeninfoEintrag,
  ReelCard,
  UserRole,
  WochenplanEintrag,
} from "./types";
import {
  brollToDb,
  dbToAccount,
  dbToBroll,
  dbToMarkeninfo,
  dbToReel,
  dbToWochenplan,
  dbToZuordnung,
  markeninfoToDb,
  reelToDb,
  wochenplanToDb,
  zuordnungToDb,
} from "./mappers";

// Platzhalter-Kennung, solange es keine echten Kundenkonten gibt.
// Sobald Supabase Auth aktiv ist, tritt hier auth.uid() an die Stelle.
const PLATZHALTER_USER_ID = "00000000-0000-0000-0000-000000000001";

interface StoreContextValue {
  reels: ReelCard[];
  broll: BRollClip[];
  accounts: BeobachteterAccount[];
  wochenplan: WochenplanEintrag[];
  markenwissen: MarkeninfoEintrag[];
  zuordnungen: BRollZuordnung[];
  loading: boolean;
  error: string | null;
  // Rolle nur zum Ausprobieren der späteren Kundenansicht.
  rolle: UserRole;
  setRolle: (rolle: UserRole) => void;
  addReel: (reel: ReelCard) => Promise<void>;
  updateReel: (id: string, patch: Partial<ReelCard>) => Promise<void>;
  removeReel: (id: string) => Promise<void>;
  duplicateReel: (reel: ReelCard) => Promise<ReelCard>;
  addAccount: (handle: string) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addWochenplanEintraege: (eintraege: WochenplanEintrag[]) => Promise<void>;
  addWochenplanEintrag: (eintrag: WochenplanEintrag) => Promise<void>;
  updateWochenplanEintrag: (id: string, patch: Partial<WochenplanEintrag>) => Promise<void>;
  removeWochenplanEintrag: (id: string) => Promise<void>;
  saveBroll: (clip: BRollClip) => Promise<void>;
  removeBroll: (id: string) => Promise<void>;
  saveMarkenwissen: (eintrag: MarkeninfoEintrag) => Promise<void>;
  // Welche Clips gelten für dieses Reel – als Kundin die eigene Auswahl.
  brollIdsFuer: (reel: ReelCard) => string[];
  // Clips zuordnen. Als Kundin wird eine eigene Zuordnung gespeichert,
  // das Reel der Marke bleibt unverändert.
  setBrollFuerReel: (reel: ReelCard, brollIds: string[]) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reels, setReels] = useState<ReelCard[]>([]);
  const [broll, setBroll] = useState<BRollClip[]>([]);
  const [accounts, setAccounts] = useState<BeobachteterAccount[]>([]);
  const [wochenplan, setWochenplan] = useState<WochenplanEintrag[]>([]);
  const [markenwissen, setMarkenwissen] = useState<MarkeninfoEintrag[]>([]);
  const [zuordnungen, setZuordnungen] = useState<BRollZuordnung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolle, setRolle] = useState<UserRole>("admin");

  useEffect(() => {
    let cancelled = false;

    async function ladeAlles() {
      setLoading(true);
      setError(null);

      if (!supabaseKonfiguriert) {
        setError(
          "Keine Verbindung zu Supabase: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlen. Lege eine .env.local an (siehe README) und starte die Anwendung neu."
        );
        setLoading(false);
        return;
      }
      const [reelsRes, brollRes, accountsRes, wochenplanRes, markenwissenRes, zuordnungenRes] =
        await Promise.all([
          supabase.from("reels").select("*").order("erstellt_am", { ascending: false }),
          supabase.from("broll").select("*").order("id"),
          supabase.from("accounts").select("*").order("hinzugefuegt_am", { ascending: false }),
          supabase.from("wochenplan").select("*").order("id"),
          supabase.from("markenwissen").select("*"),
          supabase.from("broll_zuordnungen").select("*"),
        ]);

      if (cancelled) return;

      const ersterFehler =
        reelsRes.error ||
        brollRes.error ||
        accountsRes.error ||
        wochenplanRes.error ||
        markenwissenRes.error ||
        zuordnungenRes.error;
      if (ersterFehler) {
        setError(
          `Verbindung zu Supabase fehlgeschlagen: ${ersterFehler.message}. Prüfe .env.local und ob supabase/schema.sql sowie supabase/migration_002_broll_und_planung.sql bereits ausgeführt wurden.`
        );
        setLoading(false);
        return;
      }

      setReels((reelsRes.data ?? []).map(dbToReel));
      setBroll((brollRes.data ?? []).map(dbToBroll));
      setAccounts((accountsRes.data ?? []).map(dbToAccount));
      setWochenplan((wochenplanRes.data ?? []).map(dbToWochenplan));
      setMarkenwissen((markenwissenRes.data ?? []).map(dbToMarkeninfo));
      setZuordnungen((zuordnungenRes.data ?? []).map(dbToZuordnung));
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

  // Zuordnung App-Feld -> Datenbankspalte. Alle bearbeitbaren Felder sind
  // hier aufgeführt, damit eine Änderung in der Reel-Karte auch wirklich in
  // Supabase landet und nicht still nur im Bildschirm steht.
  const REEL_SPALTEN: Record<string, string> = {
    marke: "marke",
    zielgruppe: "zielgruppe",
    ziel: "ziel",
    thema: "thema",
    produkt: "produkt",
    hook: "hook",
    brollEmpfehlung: "broll_empfehlung",
    brollIds: "broll_ids",
    textOverlays: "text_overlays",
    caption: "caption",
    cta: "cta",
    status: "status",
    contentArt: "content_art",
    freigegebenFuerKunden: "freigegeben_fuer_kunden",
  };

  async function updateReel(id: string, patch: Partial<ReelCard>) {
    const vorher = reels;
    const geaendertAm = new Date().toISOString();
    setReels((r) => r.map((x) => (x.id === id ? { ...x, ...patch, geaendertAm } : x)));

    const dbPatch: Record<string, unknown> = { geaendert_am: geaendertAm };
    for (const [feld, spalte] of Object.entries(REEL_SPALTEN)) {
      const wert = (patch as Record<string, unknown>)[feld];
      if (wert !== undefined) dbPatch[spalte] = wert;
    }

    const { error: err } = await supabase.from("reels").update(dbPatch).eq("id", id);
    if (err) {
      setError(`Änderung am Reel konnte nicht gespeichert werden: ${err.message}`);
      setReels(vorher); // zurückrollen, damit Bildschirm und Datenbank übereinstimmen
    }
  }

  async function removeReel(id: string) {
    const vorher = reels;
    setReels((r) => r.filter((x) => x.id !== id));
    const { error: err } = await supabase.from("reels").delete().eq("id", id);
    if (err) {
      setError(`Reel konnte nicht gelöscht werden: ${err.message}`);
      setReels(vorher);
    }
  }

  // Kopie eines Reels – für dasselbe Thema in anderer Zielgruppe oder Marke.
  async function duplicateReel(reel: ReelCard): Promise<ReelCard> {
    const jetzt = new Date().toISOString();
    const kopie: ReelCard = {
      ...reel,
      id: `R${Date.now().toString(36)}`,
      thema: `${reel.thema} (Kopie)`,
      status: "Entwurf",
      freigegebenFuerKunden: false,
      erstelltAm: jetzt.slice(0, 10),
      geaendertAm: jetzt,
    };
    await addReel(kopie);
    return kopie;
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

  async function addWochenplanEintrag(eintrag: WochenplanEintrag) {
    const vorher = wochenplan;
    setWochenplan((w) => [...w, eintrag]);
    const { error: err } = await supabase.from("wochenplan").insert(wochenplanToDb(eintrag));
    if (err) {
      setError(`Beitrag konnte nicht angelegt werden: ${err.message}`);
      setWochenplan(vorher);
    }
  }

  async function updateWochenplanEintrag(id: string, patch: Partial<WochenplanEintrag>) {
    const vorher = wochenplan;
    setWochenplan((w) => w.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.thema !== undefined) dbPatch.thema = patch.thema;
    if (patch.ziel !== undefined) dbPatch.ziel = patch.ziel;
    if (patch.tag !== undefined) dbPatch.tag = patch.tag;
    if (patch.uhrzeit !== undefined) dbPatch.uhrzeit = patch.uhrzeit;
    if (patch.kalenderwoche !== undefined) dbPatch.kalenderwoche = patch.kalenderwoche;
    if (patch.brollId !== undefined) dbPatch.broll_id = patch.brollId;
    if (patch.reelId !== undefined) dbPatch.reel_id = patch.reelId;
    const { error: err } = await supabase.from("wochenplan").update(dbPatch).eq("id", id);
    if (err) {
      setError(`Wochenplan-Eintrag konnte nicht gespeichert werden: ${err.message}`);
      setWochenplan(vorher);
    }
  }

  async function removeWochenplanEintrag(id: string) {
    const vorher = wochenplan;
    setWochenplan((w) => w.filter((x) => x.id !== id));
    const { error: err } = await supabase.from("wochenplan").delete().eq("id", id);
    if (err) {
      setError(`Beitrag konnte nicht entfernt werden: ${err.message}`);
      setWochenplan(vorher);
    }
  }

  // --- B-Roll verwalten ---

  async function saveBroll(clip: BRollClip) {
    const vorher = broll;
    setBroll((b) => {
      const index = b.findIndex((x) => x.id === clip.id);
      if (index >= 0) {
        const kopie = [...b];
        kopie[index] = clip;
        return kopie;
      }
      return [...b, clip].sort((a, c) => a.id.localeCompare(c.id));
    });
    const { error: err } = await supabase.from("broll").upsert(brollToDb(clip));
    if (err) {
      setError(`Clip konnte nicht gespeichert werden: ${err.message}`);
      setBroll(vorher);
    }
  }

  async function removeBroll(id: string) {
    const vorher = broll;
    setBroll((b) => b.filter((x) => x.id !== id));
    const { error: err } = await supabase.from("broll").delete().eq("id", id);
    if (err) {
      setError(`Clip konnte nicht gelöscht werden: ${err.message}`);
      setBroll(vorher);
    }
  }

  async function saveMarkenwissen(eintrag: MarkeninfoEintrag) {
    const vorher = markenwissen;
    setMarkenwissen((m) => {
      const index = m.findIndex((x) => x.marke === eintrag.marke);
      if (index >= 0) {
        const kopie = [...m];
        kopie[index] = eintrag;
        return kopie;
      }
      return [...m, eintrag];
    });
    const { error: err } = await supabase.from("markenwissen").upsert(markeninfoToDb(eintrag));
    if (err) {
      setError(`Markenwissen konnte nicht gespeichert werden: ${err.message}`);
      setMarkenwissen(vorher);
    }
  }

  // --- Persönliche B-Roll-Zuordnung ---

  function brollIdsFuer(reel: ReelCard): string[] {
    if (rolle === "admin") return reel.brollIds;
    const eigene = zuordnungen.find(
      (z) => z.userId === PLATZHALTER_USER_ID && z.reelId === reel.id
    );
    return eigene ? eigene.brollIds : reel.brollIds;
  }

  async function setBrollFuerReel(reel: ReelCard, brollIds: string[]) {
    if (rolle === "admin") {
      await updateReel(reel.id, { brollIds });
      return;
    }
    // Als Kundin: eigene Zuordnung speichern, das Reel selbst bleibt unberührt.
    const zuordnung: BRollZuordnung = {
      id: `Z-${PLATZHALTER_USER_ID}-${reel.id}`,
      userId: PLATZHALTER_USER_ID,
      reelId: reel.id,
      brollIds,
      geaendertAm: new Date().toISOString(),
    };
    const vorher = zuordnungen;
    setZuordnungen((z) => [
      ...z.filter((x) => !(x.userId === zuordnung.userId && x.reelId === zuordnung.reelId)),
      zuordnung,
    ]);
    const { error: err } = await supabase
      .from("broll_zuordnungen")
      .upsert(zuordnungToDb(zuordnung), { onConflict: "user_id,reel_id" });
    if (err) {
      setError(`Eigene Clip-Auswahl konnte nicht gespeichert werden: ${err.message}`);
      setZuordnungen(vorher);
    }
  }

  return (
    <StoreContext.Provider
      value={{
        reels,
        broll,
        accounts,
        wochenplan,
        markenwissen,
        zuordnungen,
        loading,
        error,
        rolle,
        setRolle,
        addReel,
        updateReel,
        removeReel,
        duplicateReel,
        addAccount,
        removeAccount,
        addWochenplanEintraege,
        addWochenplanEintrag,
        updateWochenplanEintrag,
        removeWochenplanEintrag,
        saveBroll,
        removeBroll,
        saveMarkenwissen,
        brollIdsFuer,
        setBrollFuerReel,
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
