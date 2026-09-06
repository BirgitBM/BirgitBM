import type { AppUser, ContentItem, RolePermissions, UserRole } from "./types";

/**
 * Rollenmodell – noch ohne echte Anmeldung.
 *
 * Sobald Supabase angebunden wird, ersetzt `supabase.auth.getUser()` den
 * Platzhalter unten. Die Rechteprüfungen (`darf...`) bleiben unverändert und
 * werden zusätzlich als Row-Level-Security-Regeln in der Datenbank gespiegelt.
 */
export const ROLLEN_RECHTE: Record<UserRole, RolePermissions> = {
  admin: {
    seeAllStatuses: true,
    darfInhalteErstellen: true,
    darfFreigeben: true,
    darfAccountsVerwalten: true,
    darfMarkenwissenBearbeiten: true,
    darfVideoHerunterladen: true,
    darfStoryHerunterladen: true,
    darfCaptionKopieren: true,
  },
  studio_kunde: {
    seeAllStatuses: false,
    darfInhalteErstellen: false,
    darfFreigeben: false,
    darfAccountsVerwalten: false,
    darfMarkenwissenBearbeiten: false,
    darfVideoHerunterladen: false,
    darfStoryHerunterladen: false,
    darfCaptionKopieren: true,
  },
  premium_kunde: {
    seeAllStatuses: false,
    darfInhalteErstellen: false,
    darfFreigeben: false,
    darfAccountsVerwalten: false,
    darfMarkenwissenBearbeiten: false,
    darfVideoHerunterladen: true,
    darfStoryHerunterladen: true,
    darfCaptionKopieren: true,
  },
};

/** Platzhalter-Benutzer, solange keine Anmeldung existiert. */
export const AKTUELLER_BENUTZER: AppUser = {
  id: "user-admin",
  name: "Birgit",
  email: "birgit@bmcolours.com",
  role: "admin",
  brandIds: ["sqt-b2b", "sqt-homecare", "exoprime", "haut-zentrum"],
};

export function rechteFuer(rolle: UserRole): RolePermissions {
  return ROLLEN_RECHTE[rolle];
}

/**
 * Einzige Stelle, an der entschieden wird, ob ein Inhalt für einen Benutzer
 * sichtbar ist. Kunden sehen ausschließlich freigegebene bzw. weiter
 * fortgeschrittene Inhalte, die zusätzlich als "kunde" markiert sind.
 */
export function darfInhaltSehen(benutzer: AppUser, inhalt: ContentItem): boolean {
  if (!benutzer.brandIds.includes(inhalt.brandId)) return false;
  if (rechteFuer(benutzer.role).seeAllStatuses) return true;
  const freigegeben =
    inhalt.status === "freigegeben" ||
    inhalt.status === "produziert" ||
    inhalt.status === "veroeffentlicht";
  return freigegeben && inhalt.visibility === "kunde";
}
