"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "@/lib/store";
import { UserRole } from "@/lib/types";

const authRequired = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/accounts", label: "Beobachtete Accounts" },
  { href: "/content-erstellen", label: "Content erstellen" },
  { href: "/broll", label: "B-Roll-Bibliothek" },
  { href: "/wochenplan", label: "Wochenplan" },
  { href: "/bibliothek", label: "Content-Bibliothek" },
  { href: "/markenwissen", label: "Markenwissen" },
];

const rollen: { wert: UserRole; label: string }[] = [
  { wert: "admin", label: "Admin" },
  { wert: "studio-kunde", label: "Studio-Kunde" },
  { wert: "premium-kunde", label: "Premium-Kunde" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { rolle, setRolle } = useStore();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-charcoal text-ivory min-h-screen sticky top-0">
      <div className="px-6 pt-8 pb-6">
        <div className="font-display text-2xl leading-none">ContentOS</div>
        <div className="text-xs text-taupe mt-1">SQT · Content-Hub</div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-gold text-charcoal font-medium"
                  : "text-ivory/80 hover:bg-white/5 hover:text-ivory"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-5 text-xs text-taupe border-t border-white/10 space-y-3">
        <div>
          <label className="block mb-1.5 uppercase tracking-wide">Ansicht testen als</label>
          <select
            value={rolle}
            onChange={(e) => setRolle(e.target.value as UserRole)}
            className="w-full rounded-md bg-white/10 px-2 py-1.5 text-ivory text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {rollen.map((r) => (
              <option key={r.wert} value={r.wert} className="text-charcoal">
                {r.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 leading-relaxed">
            Kunden sehen nur freigegebene Inhalte und können eigene Clips zuordnen.
          </p>
        </div>
        {authRequired && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-ivory/70 hover:text-ivory underline underline-offset-2"
          >
            Abmelden
          </button>
        )}
      </div>
    </aside>
  );
}
