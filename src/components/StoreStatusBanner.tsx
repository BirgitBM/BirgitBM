"use client";

import { useStore } from "@/lib/store";

export function StoreStatusBanner() {
  const { loading, error } = useStore();

  if (error) {
    return (
      <div className="mb-6 rounded-md border border-[var(--red)]/30 bg-[var(--red-bg)] text-[var(--red)] text-sm px-4 py-3">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-md border border-line bg-white text-taupe text-sm px-4 py-3">
        Lade Daten aus Supabase …
      </div>
    );
  }

  return null;
}
