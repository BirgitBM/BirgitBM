/** Kleine Icon-Sammlung als Inline-SVG – bewusst ohne zusätzliche Bibliothek. */

type IconProps = { className?: string };

function Basis({
  children,
  className,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) => (
  <Basis {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Basis>
);

export const IconResearch = (p: IconProps) => (
  <Basis {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Basis>
);

export const IconAccounts = (p: IconProps) => (
  <Basis {...p}>
    <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
    <circle cx="10" cy="8" r="3.2" />
    <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 5.2a3.2 3.2 0 0 1 0 5.6" />
  </Basis>
);

export const IconErstellen = (p: IconProps) => (
  <Basis {...p}>
    <path d="M12 5v14M5 12h14" />
  </Basis>
);

export const IconBroll = (p: IconProps) => (
  <Basis {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 11 5-3v8l-5-3z" />
  </Basis>
);

export const IconPlan = (p: IconProps) => (
  <Basis {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Basis>
);

export const IconBibliothek = (p: IconProps) => (
  <Basis {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-4A1.5 1.5 0 0 1 4 16z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H15a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 0 20 16z" />
  </Basis>
);

export const IconWissen = (p: IconProps) => (
  <Basis {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8.2v.1" />
  </Basis>
);

export const IconMenu = (p: IconProps) => (
  <Basis {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Basis>
);

export const IconSchliessen = (p: IconProps) => (
  <Basis {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Basis>
);

export const IconPfeil = (p: IconProps) => (
  <Basis {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Basis>
);

export const IconCheck = (p: IconProps) => (
  <Basis {...p}>
    <path d="m5 13 4 4L19 7" />
  </Basis>
);

export const IconMuell = (p: IconProps) => (
  <Basis {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Basis>
);

export const IconKopieren = (p: IconProps) => (
  <Basis {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </Basis>
);
