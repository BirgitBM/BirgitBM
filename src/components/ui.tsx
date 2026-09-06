"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";
import type { ContentStatus } from "@/lib/types";

export function cx(...klassen: Array<string | false | null | undefined>): string {
  return klassen.filter(Boolean).join(" ");
}

/* ------------------------------- Seiten ------------------------------- */

export function PageHeader({
  titel,
  beschreibung,
  aktionen,
}: {
  titel: string;
  beschreibung?: string;
  aktionen?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {titel}
        </h1>
        {beschreibung && (
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{beschreibung}</p>
        )}
      </div>
      {aktionen && <div className="flex flex-wrap gap-2">{aktionen}</div>}
    </header>
  );
}

/* -------------------------------- Karte ------------------------------- */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  titel,
  beschreibung,
  aktion,
}: {
  titel: string;
  beschreibung?: string;
  aktion?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{titel}</h2>
        {beschreibung && (
          <p className="mt-1 text-sm text-slate-500">{beschreibung}</p>
        )}
      </div>
      {aktion}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("px-5 py-4", className)}>{children}</div>;
}

/* ------------------------------- Buttons ------------------------------ */

type ButtonVariante = "primaer" | "sekundaer" | "dezent" | "gefahr";

const BUTTON_STYLES: Record<ButtonVariante, string> = {
  primaer:
    "bg-marke-700 text-white hover:bg-marke-800 focus-visible:outline-marke-700",
  sekundaer:
    "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400",
  dezent:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-400",
  gefahr:
    "bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 focus-visible:outline-rose-400",
};

export function Button({
  variante = "sekundaer",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: ButtonVariante }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_STYLES[variante],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Badges ------------------------------- */

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

/* ----------------------------- Formulare ------------------------------ */

export function Field({
  label,
  hinweis,
  children,
}: {
  label: string;
  hinweis?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </span>
      {children}
      {hinweis && <span className="mt-1.5 block text-xs text-slate-500">{hinweis}</span>}
    </label>
  );
}

export const eingabeKlassen =
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-marke-600 outline-none";

/* ------------------------------ Leerzustand --------------------------- */

export function EmptyState({
  titel,
  beschreibung,
  aktion,
}: {
  titel: string;
  beschreibung: string;
  aktion?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{titel}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{beschreibung}</p>
      {aktion && <div className="mt-5 flex justify-center">{aktion}</div>}
    </div>
  );
}

/* -------------------------------- Hinweis ----------------------------- */

export function Hinweis({
  children,
  ton = "info",
}: {
  children: ReactNode;
  ton?: "info" | "warnung";
}) {
  return (
    <div
      className={cx(
        "rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        ton === "info"
          ? "bg-marke-50 text-marke-900 ring-marke-200"
          : "bg-amber-50 text-amber-900 ring-amber-200",
      )}
    >
      {children}
    </div>
  );
}
