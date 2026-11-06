// Иконки из прототипа. SVG статичные, данные API в них не попадают.

export function LogoMark() {
  return (
    <span className="logo-mark lm-plain" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7l5 5-5 5" stroke="var(--accent)" strokeWidth="2.6" />
        <path d="M13 17h5" stroke="var(--ink)" strokeWidth="2.6" />
      </svg>
    </span>
  );
}

export const IcoSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IcoMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

export const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const PROF_SVG: Record<string, string> = {
  frontend: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M13.5 5l-3 14"/>',
  backend: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  qa: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  python: '<path d="M12 3c-4 0-4 2-4 3v2h4v1H6c-2 0-3 1.5-3 4s1 4 3 4h2v-3c0-1.5 1-2.5 2.5-2.5h3c1.5 0 2.5-1 2.5-2.5V6c0-1.5-1.5-3-4-3z"/><path d="M12 21c4 0 4-2 4-3v-2h-4v-1h6c2 0 3-1.5 3-4"/>',
  data: '<path d="M3 3v18h18"/><path d="M7 15v2M11 10v7M15 12v5M19 6v11"/>',
};

const PROF_CLR: Record<string, [string, string]> = {
  frontend: ["#5B86FF", "#2A4FD4"],
  backend: ["#9A7BFF", "#5B3FD0"],
  qa: ["#3DD39A", "#119068"],
  python: ["#4FA3FF", "#2766C9"],
  data: ["#38CFE3", "#1590AA"],
};

// Профессия из API → иконка и цвета прототипа.
const BY_SLUG: Record<string, string> = {
  "qa-manual": "qa",
  "python-developer": "python",
  "java-developer": "backend",
  "frontend-developer": "frontend",
};

export function profStyle(slug: string): React.CSSProperties {
  const [c1, c2] = PROF_CLR[BY_SLUG[slug] ?? "data"];
  return { ["--c1" as string]: c1, ["--c2" as string]: c2 };
}

/** Квадратик-иконка профессии (.pk-i из прототипа). */
export function ProfIcon({ slug, small }: { slug: string; small?: boolean }) {
  const inner = PROF_SVG[BY_SLUG[slug] ?? "data"];
  return (
    <span className={"pk-i" + (small ? " sm" : "")} style={profStyle(slug)}>
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" dangerouslySetInnerHTML={{ __html: inner }}
      />
    </span>
  );
}
