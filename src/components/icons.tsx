import Link from "next/link";

/* Sistem ikon TestForge — dikonversi dari "testforge design system"
   (icons-data.js, gaya C: stroke 1.8, aksen indigo, fill accent-soft).
   .tf-ac = stroke aksen, .tf-acf = fill aksen lembut (lihat globals.css).
   Varian: `current` mengikuti currentColor (untuk sidebar gelap),
   `onAccent` untuk ikon di atas latar indigo (logo mark). */

const ICONS: Record<string, string> = {
  // 1. Branding
  logo: `<rect class="tf-acf" x="3.5" y="6" width="13.5" height="3.4" rx="1.2"/><path class="tf-acf" d="M16.5 6.2 h3.6 c-.4 2.1 -2.1 3.2 -3.6 3.2 z"/><rect x="9.6" y="9.4" width="3" height="2.6"/><path class="tf-acf" d="M5.4 18.4 c.6 -3.4 2.8 -5.2 6.1 -5.2 s5.5 1.8 6.1 5.2 z"/><path class="tf-ac" d="M3.5 18.6 h17"/>`,
  // 2. Core features
  manual: `<rect x="5" y="5" width="14" height="16" rx="2.2"/><path class="tf-acf" d="M9 4 h6 a1 1 0 0 1 1 1 v1.4 a1 1 0 0 1 -1 1 H9 a1 1 0 0 1 -1 -1 V5 a1 1 0 0 1 1 -1 z"/><path class="tf-ac" d="M8.5 13 l2 2 l4 -4.2"/><path d="M8.5 18 h7"/>`,
  automation: `<rect x="5" y="8.5" width="14" height="10.5" rx="2.6"/><circle class="tf-acf" cx="9.5" cy="13.5" r="1.25"/><circle class="tf-acf" cx="14.5" cy="13.5" r="1.25"/><path d="M12 8.5 V5.4"/><circle cx="12" cy="4.3" r="1.2"/><path d="M5 13.5 H3.3 M19 13.5 H20.7"/><path class="tf-ac" d="M9.7 16.4 h4.6"/>`,
  cicd: `<path d="M5.5 10.5 a7 7 0 0 1 11.6 -2.7"/><path class="tf-ac" d="M17.5 4.6 l.4 3.6 l-3.6 .4"/><path d="M18.5 13.5 a7 7 0 0 1 -11.6 2.7"/><path class="tf-ac" d="M6.5 19.4 l-.4 -3.6 l3.6 -.4"/>`,
  dashboard: `<rect x="4" y="4" width="16" height="16" rx="2.4"/><path d="M8.5 16 V12"/><path class="tf-ac" d="M12 16 V8.5"/><path d="M15.5 16 V10.5"/>`,
  // 4. Project templates
  "tpl-blank": `<path d="M7 3.5 h6.2 L18 8.3 V19 a1.6 1.6 0 0 1 -1.6 1.6 H7 A1.6 1.6 0 0 1 5.4 19 V5.1 A1.6 1.6 0 0 1 7 3.5 z"/><path class="tf-acf" d="M13 3.6 v4.2 a.8 .8 0 0 0 .8 .8 H18 z"/>`,
  "tpl-web": `<circle cx="12" cy="12" r="8"/><path d="M4 12 h16"/><path class="tf-ac" d="M12 4 a12 12 0 0 1 0 16 a12 12 0 0 1 0 -16"/>`,
  "tpl-mobile": `<rect x="7" y="3" width="10" height="18" rx="2.6"/><path class="tf-ac" d="M10.6 5.4 h2.8"/><circle class="tf-acf" cx="12" cy="18" r="0.7"/>`,
  "tpl-api": `<path d="M9.5 7.5 V4 M14.5 7.5 V4"/><rect x="7.5" y="7.5" width="9" height="5.5" rx="1.4"/><path class="tf-ac" d="M12 13 v3.2 a3 3 0 0 1 -3 3 H7.4"/>`,
  // 5. UI actions
  edit: `<path d="M4.2 19.8 l1.2 -4.3 L15.4 5.5 a1.6 1.6 0 0 1 2.2 0 l.9 .9 a1.6 1.6 0 0 1 0 2.2 L8.5 18.6 z"/><path class="tf-ac" d="M14 7 l3 3"/>`,
  clone: `<rect x="8" y="8" width="11" height="11" rx="2.2"/><path class="tf-ac" d="M15.5 8 V6 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 v7.5 a2 2 0 0 0 2 2 h2"/>`,
  delete: `<path d="M5 7 h14"/><path d="M9 7 V5.6 a1.6 1.6 0 0 1 1.6 -1.6 h2.8 A1.6 1.6 0 0 1 15 5.6 V7"/><path class="tf-acf" d="M6.6 7 h10.8 l-.9 11.8 a1.6 1.6 0 0 1 -1.6 1.5 H9.1 a1.6 1.6 0 0 1 -1.6 -1.5 z"/><path class="tf-ac" d="M10.3 11 v5.4 M13.7 11 v5.4"/>`,
  valid: `<circle class="tf-acf" cx="12" cy="12" r="8"/><path class="tf-ac" d="M8.4 12.2 l2.6 2.6 L16 9.4"/>`,
  invalid: `<circle cx="12" cy="12" r="8"/><path class="tf-ac" d="M9.3 9.3 l5.4 5.4 M14.7 9.3 l-5.4 5.4"/>`,
  // 6. Navigation
  "nav-projects": `<path class="tf-acf" d="M4 7.5 a2 2 0 0 1 2 -2 h3.3 l1.8 2 H18 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 z"/>`,
  "nav-keys": `<circle cx="8.5" cy="8.5" r="3.8"/><path class="tf-ac" d="M11.2 11.2 L19 19 M16.4 16.4 l1.8 -1.8 M14.2 14.2 l1.8 -1.8"/>`,
  "nav-audit": `<path d="M6 4.5 h8.5 a1.8 1.8 0 0 1 1.8 1.8 V17 a2.2 2.2 0 0 0 2.2 2.2 H8.4 A2.4 2.4 0 0 1 6 16.8 z"/><path class="tf-ac" d="M9 9 h5 M9 12.4 h5"/>`,
  "nav-tree": `<rect class="tf-acf" x="4" y="4" width="6" height="3.6" rx="1"/><path d="M7 7.6 V17 M7 12 h4 M7 17 h4"/><rect x="13" y="10.2" width="6" height="3.6" rx="1"/><rect x="13" y="15.2" width="6" height="3.6" rx="1"/>`,
  // 7. Import / export
  import: `<path d="M5 15 v2.5 a1.5 1.5 0 0 0 1.5 1.5 h11 a1.5 1.5 0 0 0 1.5 -1.5 V15"/><path class="tf-ac" d="M12 4 V14 M8.4 10.4 L12 14 l3.6 -3.6"/>`,
  download: `<path class="tf-ac" d="M12 4 V15.5 M7.6 11.1 L12 15.5 l4.4 -4.4"/><path d="M5.5 19.5 h13"/>`,
  upload: `<path class="tf-ac" d="M12 15.5 V4 M7.6 8.4 L12 4 l4.4 4.4"/><path d="M5.5 19.5 h13"/>`,
  // 8. Communication
  mailbox: `<rect x="4" y="6" width="16" height="12" rx="2.2"/><path class="tf-ac" d="M4.6 8 L12 13 l7.4 -5"/>`,
  // 9. Analytics & reports
  trend: `<path d="M4.5 4 V19.5 H20"/><path class="tf-ac" d="M7 15.5 l3 -3 l3 1.8 l4.5 -5.3"/><path class="tf-ac" d="M14.5 7.8 h3.5 v3.5"/>`,
  flaky: `<rect x="5" y="5" width="14" height="14" rx="3.2"/><circle class="tf-acf" cx="9" cy="9" r="1.05"/><circle class="tf-acf" cx="12" cy="12" r="1.05"/><circle class="tf-acf" cx="15" cy="15" r="1.05"/>`,
  bug: `<path d="M9.5 6 l1.4 2 M14.5 6 l-1.4 2"/><circle cx="12" cy="9" r="2"/><path class="tf-acf" d="M7 13.5 a5 5.5 0 0 1 10 0 a5 5.5 0 0 1 -10 0 z"/><path d="M12 11.2 V19"/><path class="tf-ac" d="M7 12.5 H4 M7 15 H4.3 M7.4 17.6 H5 M17 12.5 h3 M17 15 h2.7 M16.6 17.6 h2.4"/>`,
  breakdown: `<rect x="4" y="5" width="16" height="14" rx="2.2"/><path class="tf-acf" d="M4.6 5.6 h14.8 v3.4 H4.6 z"/><path d="M4 9 h16 M12 9 V19"/>`,
  // 10. Milestones
  target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.6"/><circle class="tf-acf" cx="12" cy="12" r="1.4"/>`,
  // 11. Social proof
  stars: `<path class="tf-acf" d="M12 3.8 l2.42 4.9 l5.4 .79 l-3.91 3.8 l.92 5.38 l-4.83 -2.54 l-4.83 2.54 l.92 -5.38 l-3.91 -3.8 l5.4 -.79 z"/>`,
  frameworks: `<path d="M9.5 3.5 h5 M10.5 3.5 V10 L6.6 16.8 a2 2 0 0 0 1.8 3 h7.2 a2 2 0 0 0 1.8 -3 L13.5 10 V3.5"/><path class="tf-acf" d="M8 15 h8 l1.4 2.4 a2 2 0 0 1 -1.8 2.6 H8.4 a2 2 0 0 1 -1.8 -2.6 z"/><circle class="tf-ac" cx="11" cy="17.5" r="0.7"/>`,
  geo: `<path class="tf-acf" d="M12 3.5 a6 6 0 0 1 6 6 c0 4.4 -6 11 -6 11 s-6 -6.6 -6 -11 a6 6 0 0 1 6 -6 z"/><circle class="tf-ac" cx="12" cy="9.5" r="2.2"/>`,
  "docker-setup": `<rect x="5" y="11" width="3" height="3" rx=".5"/><rect x="8.5" y="11" width="3" height="3" rx=".5"/><rect x="12" y="11" width="3" height="3" rx=".5"/><rect class="tf-acf" x="8.5" y="7.5" width="3" height="3" rx=".5"/><path class="tf-ac" d="M4 14.5 h13 a4 4 0 0 0 3.8 -3 a2.4 2.4 0 0 0 -3.4 .4 a3 3 0 0 0 -2 -3 a3.2 3.2 0 0 0 -.4 3 M5 18.5 c3.5 1.6 9.5 1.4 12 -2.5"/>`,
  checklist: `<rect x="4" y="4" width="16" height="16" rx="3.4"/><path class="tf-ac" d="M8 12.2 l2.6 2.6 L16.2 9"/>`,
  // 12. Success
  celebrate: `<path class="tf-acf" d="M4 20 L8.6 8.4 a1 1 0 0 1 1.6 -.35 l5.7 5.7 a1 1 0 0 1 -.35 1.6 z"/><path class="tf-ac" d="M16.5 4 v2.4 M19.8 7.2 l-1.7 1.7 M20.5 11.5 h-2.4"/><circle class="tf-ac" cx="13.5" cy="5.5" r="0.6"/><circle class="tf-ac" cx="19.5" cy="13" r="0.6"/>`,
};

export type IconName = keyof typeof ICONS;

export function TFIcon({
  name,
  className = "h-5 w-5",
  current = false,
  onAccent = false,
}: {
  name: string;
  className?: string;
  current?: boolean;
  onAccent?: boolean;
}) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`tficon ${current ? "tf-current" : ""} ${onAccent ? "tf-onaccent" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

/* Brand mark resmi integrasi — dari brand-data.js ("pakai icon asli"). */
const BRANDS: Record<string, string> = {
  jira: `<defs><linearGradient id="tfjg" x1="98%" y1="0%" x2="36%" y2="46%"><stop offset="0" stop-color="#0052CC"/><stop offset="1" stop-color="#2684FF"/></linearGradient></defs><path fill="#2684FF" d="M11.57 11.51H0a5.22 5.22 0 0 0 5.23 5.22h2.13v2.05A5.22 5.22 0 0 0 12.58 24V12.52a1 1 0 0 0-1.01-1.01z"/><path fill="url(#tfjg)" d="M17.29 5.76H5.74a5.22 5.22 0 0 0 5.21 5.21h2.13v2.06a5.22 5.22 0 0 0 5.22 5.21V6.76a1 1 0 0 0-1.01-1z"/><path fill="url(#tfjg)" d="M23.01 0H11.46a5.22 5.22 0 0 0 5.21 5.22h2.13v2.05A5.22 5.22 0 0 0 24 12.48V1.01A1 1 0 0 0 23.01 0z"/>`,
  github: `<path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.7.83.58A12 12 0 0 0 12 .3z"/>`,
  cypress: `<circle cx="12" cy="12" r="11.3" fill="#1B1E2E"/><path fill="none" stroke="#69D3A7" stroke-width="1.7" stroke-linecap="round" d="M14.3 8.6a4 4 0 1 0 0 6.8"/><path fill="#69D3A7" d="M6.2 9.4l1.7 5 1.7-5h1.5l-2.4 6.4c-.4 1.1-.9 1.6-1.9 1.6-.3 0-.6 0-.9-.1v-1.2c.2 0 .4.1.6.1.4 0 .6-.2.8-.6l.1-.3-2.4-5.9z"/>`,
  slack: `<path fill="#36C5F0" d="M6.2 14.9a2 2 0 1 1-2-2h2zM7.2 14.9a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0z"/><path fill="#2EB67D" d="M9.2 6.1a2 2 0 1 1 2-2v2zM9.2 7.1a2 2 0 1 1 0 4h-5a2 2 0 1 1 0-4z"/><path fill="#ECB22E" d="M17.9 9.1a2 2 0 1 1 2 2h-2zM16.9 9.1a2 2 0 1 1-4 0v-5a2 2 0 1 1 4 0z"/><path fill="#E01E5A" d="M14.9 17.9a2 2 0 1 1-2 2v-2zM14.9 16.9a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4z"/>`,
  docker: `<g fill="#2496ED"><rect x="2.6" y="11" width="2.5" height="2.4" rx=".3"/><rect x="5.5" y="11" width="2.5" height="2.4" rx=".3"/><rect x="8.4" y="11" width="2.5" height="2.4" rx=".3"/><rect x="11.3" y="11" width="2.5" height="2.4" rx=".3"/><rect x="5.5" y="8.2" width="2.5" height="2.4" rx=".3"/><rect x="8.4" y="8.2" width="2.5" height="2.4" rx=".3"/><rect x="8.4" y="5.4" width="2.5" height="2.4" rx=".3"/><path d="M22.5 11.4c-.5-.35-1.7-.48-2.6-.3-.12-.85-.6-1.6-1.45-2.27l-.5-.33-.33.5c-.42.64-.56 1.7-.1 2.45.2.34.5.6.85.78-.3.16-.9.38-1.68.37H1.9c-.3 1.78.2 4.08 1.55 5.65 1.3 1.5 3.27 2.26 5.84 2.26 5.56 0 9.68-2.56 11.6-7.2.76.01 2.4.01 3.23-1.57.05-.09.18-.35.55-1.15z"/></g>`,
};

export function BrandIcon({
  name,
  className = "h-6 w-6",
}: {
  name: string;
  className?: string;
}) {
  const inner = BRANDS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

/* Logo: mark indigo + wordmark Space Grotesk ("Test" ink, "Forge" aksen). */
export function Logo({
  href = "/",
  size = "md",
  dark = false,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}) {
  const mark = { sm: "h-7 w-7 rounded-lg", md: "h-9 w-9 rounded-[10px]", lg: "h-12 w-12 rounded-xl" }[size];
  const icon = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];

  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span
        className={`grid place-items-center bg-indigo-600 shadow-[0_6px_20px_-8px_rgba(79,70,229,.6)] ${mark}`}
      >
        <TFIcon name="logo" onAccent className={icon} />
      </span>
      <span className={`font-display font-bold tracking-tight ${text} ${dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
        Test<span className="text-indigo-600 dark:text-indigo-400">Forge</span>
      </span>
    </Link>
  );
}
