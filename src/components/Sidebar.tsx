"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

export function Sidebar() {
  const pathname = usePathname();

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
      <div className="px-6 py-5 text-xs text-taupe border-t border-white/10 space-y-2">
        <div>Version 1</div>
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
