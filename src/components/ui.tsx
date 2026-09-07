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
