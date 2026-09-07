"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-30 bg-charcoal text-ivory">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-display text-lg">ContentOS</div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü öffnen"
          aria-expanded={open}
          className="p-2 -mr-2"
        >
          <div className="w-5 h-0.5 bg-ivory mb-1.5" />
          <div className="w-5 h-0.5 bg-ivory mb-1.5" />
          <div className="w-5 h-0.5 bg-ivory" />
        </button>
      </div>
      {open && (
        <nav className="px-3 pb-3 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? "bg-gold text-charcoal font-medium" : "text-ivory/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
