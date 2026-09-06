"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconAccounts,
  IconBibliothek,
  IconBroll,
  IconDashboard,
  IconErstellen,
  IconMenu,
  IconPlan,
  IconResearch,
  IconSchliessen,
  IconWissen,
} from "@/components/icons";
import { cx } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

const NAVIGATION = [
  { href: "/", label: "Dashboard", Icon: IconDashboard },
  { href: "/research", label: "Research", Icon: IconResearch },
  { href: "/accounts", label: "Beobachtete Accounts", Icon: IconAccounts },
  { href: "/erstellen", label: "Content erstellen", Icon: IconErstellen },
  { href: "/broll", label: "B-Roll-Bibliothek", Icon: IconBroll },
  { href: "/wochenplan", label: "Wochenplan", Icon: IconPlan },
  { href: "/bibliothek", label: "Content-Bibliothek", Icon: IconBibliothek },
  { href: "/markenwissen", label: "Markenwissen", Icon: IconWissen },
];

/** Seiten, die für Kundenrollen später nicht sichtbar sein sollen. */
const NUR_ADMIN = ["/research", "/accounts", "/erstellen", "/markenwissen"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { benutzer, rolleWechseln, marken, markeId, markeWechseln } = useStore();
  const [menuOffen, setMenuOffen] = useState(false);

  useEffect(() => {
    setMenuOffen(false);
  }, [pathname]);

  const sichtbareNavigation = NAVIGATION.filter(
    (eintrag) => benutzer.role === "admin" || !NUR_ADMIN.includes(eintrag.href),
  );

  const seitenleiste = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marke-700 text-sm font-bold text-white">
          C
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ContentOS</p>
          <p className="text-xs text-slate-400">Content-Dashboard</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Marke
        </label>
        <select
          value={markeId}
          onChange={(event) => markeWechseln(event.target.value)}
          className="w-full rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm text-white ring-1 ring-inset ring-slate-700 outline-none focus:ring-2 focus:ring-marke-500"
        >
          {marken.map((marke) => (
            <option key={marke.id} value={marke.id}>
              {marke.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {sichtbareNavigation.map(({ href, label, Icon }) => {
          const aktiv =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                aktiv
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon className={cx("h-5 w-5", aktiv ? "text-marke-300" : "text-slate-400")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Ansicht testen als
        </label>
        <select
          value={benutzer.role}
          onChange={(event) => rolleWechseln(event.target.value as UserRole)}
          className="w-full rounded-lg border-0 bg-slate-800 px-3 py-2 text-sm text-white ring-1 ring-inset ring-slate-700 outline-none focus:ring-2 focus:ring-marke-500"
        >
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((rolle) => (
            <option key={rolle} value={rolle}>
              {ROLE_LABELS[rolle]}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Vorschau des späteren Kundenzugangs. Kunden sehen nur freigegebene
          Inhalte.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Seitenleiste Desktop */}
      <aside className="hidden w-64 shrink-0 bg-slate-900 lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        {seitenleiste}
      </aside>

      {/* Kopfzeile Mobil */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marke-700 text-sm font-bold text-white">
            C
          </div>
          <span className="text-sm font-semibold text-slate-900">ContentOS</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOffen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Menü öffnen"
        >
          <IconMenu />
        </button>
      </div>

      {/* Seitenleiste Mobil */}
      {menuOffen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMenuOffen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-900">
            <button
              type="button"
              onClick={() => setMenuOffen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              aria-label="Menü schließen"
            >
              <IconSchliessen />
            </button>
            {seitenleiste}
          </div>
        </div>
      )}

      <main className="flex-1 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
