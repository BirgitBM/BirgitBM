import { ContentStatus } from "@/lib/types";
import Link from "next/link";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-line rounded-lg p-5 ${className}`}>{children}</div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl text-charcoal">{title}</h1>
      {subtitle && <p className="text-taupe mt-1.5 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

const statusStyles: Record<ContentStatus, string> = {
  Idee: "bg-line text-charcoal",
  Entwurf: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Freigegeben: "bg-blush text-[var(--amber)]",
  Produziert: "bg-[var(--green-bg)] text-[var(--green)]",
  Veröffentlicht: "bg-charcoal text-ivory",
};

export function StatusPill({ status }: { status: ContentStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  href,
  disabled,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  href?: string;
  disabled?: boolean;
  className?: string;
}) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-gold text-charcoal hover:brightness-95",
    secondary: "bg-white text-charcoal border border-line hover:bg-ivory",
    ghost: "text-taupe hover:text-charcoal",
  };
  const cls = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-line rounded-lg p-8 text-center text-taupe text-sm">
      {text}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-charcoal placeholder:text-taupe/70 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold";

// --- Direkt bearbeitbare Felder ---
//
// Sehen aus wie normaler Text, bekommen beim Darüberfahren einen Rahmen und
// wachsen mit dem Inhalt mit. Aufbau: Hintergrund und Rahmen liegen auf dem
// umschliessenden Element, das Eingabefeld selbst ist durchsichtig – so
// heben sich keine Klassen gegenseitig auf. Die Höhe gibt eine unsichtbare
// Kopie des Textes in derselben Rasterzelle vor.

export function AutoTextarea({
  wert,
  onChange,
  label,
  placeholder,
  rahmen = "bg-transparent border-transparent",
  textKlassen = "px-3 py-2 text-sm",
}: {
  wert: string;
  onChange: (neu: string) => void;
  label: string;
  placeholder?: string;
  rahmen?: string;
  textKlassen?: string;
}) {
  const inhalt = `w-full whitespace-pre-wrap break-words [grid-area:1/1] ${textKlassen}`;
  return (
    <div
      className={`grid rounded-md border transition-colors hover:border-line focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/50 ${rahmen}`}
    >
      <span aria-hidden className={`${inhalt} invisible`}>
        {wert + " "}
      </span>
      <textarea
        value={wert}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inhalt} resize-none overflow-hidden bg-transparent focus:outline-none`}
      />
    </div>
  );
}

export function AutoInput({
  wert,
  onChange,
  label,
  placeholder,
  textKlassen = "px-2 py-1 text-sm",
}: {
  wert: string;
  onChange: (neu: string) => void;
  label: string;
  placeholder?: string;
  textKlassen?: string;
}) {
  return (
    <input
      value={wert}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border border-transparent bg-transparent transition-colors hover:border-line focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50 ${textKlassen}`}
    />
  );
}

export function Hinweis({
  children,
  ton = "info",
}: {
  children: ReactNode;
  ton?: "info" | "warnung";
}) {
  const styles =
    ton === "warnung"
      ? "border-[var(--amber)]/30 bg-[var(--amber-bg)] text-[var(--amber)]"
      : "border-line bg-ivory text-charcoal";
  return <div className={`rounded-md border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
