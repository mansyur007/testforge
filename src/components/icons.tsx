import Link from "next/link";
import type { ReactNode } from "react";

/* Sistem ikon TestForge — dikonversi dari "testforge design system"
   (icons-data.js, gaya C: stroke 1.8, aksen indigo, fill accent-soft).
   .tf-ac = stroke aksen, .tf-acf = fill aksen lembut (lihat globals.css).
   Varian: `current` mengikuti currentColor (untuk sidebar gelap),
   `onAccent` untuk ikon di atas latar indigo (logo mark). */

const ICONS: Record<string, string> = {
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
  "nav-account": `<circle cx="12" cy="8.4" r="3.5"/><path class="tf-acf" d="M5.5 19.2 a6.5 6.5 0 0 1 13 0 z"/>`,
  // Pasangan folder untuk suite tree — tertutup saat collapsed, terbuka saat expanded.
  folder: `<path class="tf-acf" d="M3.6 7.4 a2 2 0 0 1 2 -2 h3.3 l1.8 2 H18.4 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 H5.6 a2 2 0 0 1 -2 -2 z"/>`,
  "folder-open": `<path d="M3.6 16.6 V7.4 a2 2 0 0 1 2 -2 h3.3 l1.8 2 H17 a2 2 0 0 1 2 2 v1.6"/><path class="tf-acf" d="M3.6 11 h16.6 a1 1 0 0 1 .97 1.25 l-1.4 5.3 A2 2 0 0 1 17.8 19 H5.6 a2 2 0 0 1 -2 -2 z"/>`,
  "nav-team": `<circle cx="9" cy="8.5" r="3"/><path class="tf-acf" d="M3.5 18.5 a5.5 5.5 0 0 1 11 0 z"/><circle class="tf-ac" cx="16.6" cy="9" r="2.2"/><path class="tf-ac" d="M15.2 14.3 a4.4 4.4 0 0 1 5.3 4.2 h-2.8"/>`,
  "nav-help": `<circle cx="12" cy="12" r="8"/><path class="tf-ac" d="M9.4 9.6 a2.7 2.7 0 0 1 5.2 1 c0 1.8 -2.3 2 -2.3 3.6"/><circle class="tf-acf" cx="12.2" cy="17" r="0.9"/>`,
  // L-05: archive box — lid, body, latch.
  "nav-backup": `<rect class="tf-acf" x="4" y="4.5" width="16" height="4.2" rx="1.4"/><path d="M5.6 8.7 h12.8 V18 a1.8 1.8 0 0 1 -1.8 1.8 H7.4 A1.8 1.8 0 0 1 5.6 18 z"/><path class="tf-ac" d="M10.2 12.4 h3.6"/>`,
  // 7. Import / export
  import: `<path d="M5 15 v2.5 a1.5 1.5 0 0 0 1.5 1.5 h11 a1.5 1.5 0 0 0 1.5 -1.5 V15"/><path class="tf-ac" d="M12 4 V14 M8.4 10.4 L12 14 l3.6 -3.6"/>`,
  // F-35: printer outline — top sheet, body, ejected page.
  print: `<path d="M7.5 8.5 V4.5 a1 1 0 0 1 1 -1 h7 a1 1 0 0 1 1 1 v4"/><path d="M6 8.5 h12 a2 2 0 0 1 2 2 v4.5 a1 1 0 0 1 -1 1 h-2.5 M6 8.5 a2 2 0 0 0 -2 2 v4.5 a1 1 0 0 0 1 1 h2.5"/><path class="tf-acf" d="M7.5 14.5 h9 v4 a1 1 0 0 1 -1 1 h-7 a1 1 0 0 1 -1 -1 z"/><circle class="tf-ac" cx="16.5" cy="11.2" r="0.7"/>`,
  // F-36: hamburger menu — three bars, top one accented.
  menu: `<path class="tf-ac" d="M4.5 7 h15"/><path d="M4.5 12 h15 M4.5 17 h15"/>`,
  // F-29: AI assist — a large four-point sparkle plus a small one.
  ai: `<path class="tf-acf" d="M11 4 c.6 3.2 1.8 4.4 5 5 c-3.2 .6 -4.4 1.8 -5 5 c-.6 -3.2 -1.8 -4.4 -5 -5 c3.2 -.6 4.4 -1.8 5 -5 z"/><path class="tf-ac" d="M17.5 13 c.3 1.5 .9 2.1 2.4 2.4 c-1.5 .3 -2.1 .9 -2.4 2.4 c-.3 -1.5 -.9 -2.1 -2.4 -2.4 c1.5 -.3 2.1 -.9 2.4 -2.4 z"/>`,
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
  // F-15: eye — "needs my review" filter chip.
  review: `<path d="M3 12 c2.4 -4.6 5.9 -6.8 9 -6.8 s6.6 2.2 9 6.8 c-2.4 4.6 -5.9 6.8 -9 6.8 s-6.6 -2.2 -9 -6.8 z"/><circle class="tf-acf" cx="12" cy="12" r="2.6"/>`,
  // 13. Back navigation
  "chevron-left": `<path d="M15 5.5 L8.5 12 l6.5 6.5"/>`,
  // Settings cog — one continuous 7-tooth silhouette with an accent-soft hub,
  // matching the fill-plus-outline idiom of the other nav icons. Distinct from
  // "nav-keys" (API Keys) so the Settings trigger reads as its own thing.
  gear: `<path class="tf-acf" d="M9.86 2.74 L14.14 2.74 L14.62 5.18 L15.70 5.71 L17.90 4.56 L20.57 7.90 L18.96 9.80 L19.23 10.97 L21.50 11.98 L20.55 16.14 L18.06 16.07 L17.31 17.01 L17.94 19.41 L14.09 21.27 L12.60 19.28 L11.40 19.28 L9.91 21.27 L6.06 19.41 L6.69 17.01 L5.94 16.07 L3.45 16.14 L2.50 11.98 L4.77 10.97 L5.04 9.80 L3.43 7.90 L6.10 4.56 L8.30 5.71 L9.38 5.18 Z"/><circle cx="12" cy="12" r="3.1" fill="#fff"/>`,
  // 12. Success
  celebrate: `<path class="tf-acf" d="M4 20 L8.6 8.4 a1 1 0 0 1 1.6 -.35 l5.7 5.7 a1 1 0 0 1 -.35 1.6 z"/><path class="tf-ac" d="M16.5 4 v2.4 M19.8 7.2 l-1.7 1.7 M20.5 11.5 h-2.4"/><circle class="tf-ac" cx="13.5" cy="5.5" r="0.6"/><circle class="tf-ac" cx="19.5" cy="13" r="0.6"/>`,
};

export type IconName = keyof typeof ICONS;

/* Back-navigation link: chevron + label, used in place of a bare "←" glyph
   (inconsistent glyph metrics/weight across fonts). `dark` variant is for
   links on a dark bar (e.g. the mobile run executor). */
export function BackLink({
  href,
  children,
  variant = "default",
  className = "",
  testId,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "dark";
  className?: string;
  testId?: string;
}) {
  const colors =
    variant === "dark"
      ? "text-slate-300 hover:text-white"
      : "text-slate-500 hover:text-indigo-600";
  return (
    <Link
      href={href}
      data-testid={testId}
      className={`inline-flex items-center gap-1 text-sm font-medium motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-tf-out ${colors} ${className}`}
    >
      <TFIcon name="chevron-left" className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}

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

/* Brand mark resmi integrasi — geometri & warna asli ("pakai icon asli").
   Disinkronkan dengan TF_BRANDS dari "TestForge Icon System".
   Key dicocokkan dengan brandId di page.tsx (name.toLowerCase().replace(/\s+/g,"-")). */
const BRANDS: Record<string, string> = {
  // test runners
  // Geometri resmi Cypress (via simple-icons), warna brand asli.
  cypress: `<path fill="#69D3A7" d="M11.998.0195c-.8642 0-1.6816.1101-2.1445.1934v.002C4.1731 1.2283 0 6.1368 0 12.0018c0 1.1265.1573 2.2328.4648 3.3028.0387.1453.0915.2993.1368.4473 1.607 4.865 6.2245 8.226 11.3925 8.2285.0651 0 .2518-.0003.502-.0118.8564-.0353 1.6228-.5734 1.9512-1.369l.4736-1.1544L20.4258 8.043H18.621l-2.3164 5.871-2.334-5.871h-1.9082l3.2734 8.0117c-.8115 1.9702-1.6252 3.9395-2.4355 5.9101-.0808.1945-.2655.3284-.4727.336-.144.005-.285.0098-.4316.0098-4.5848 0-8.6672-3.0695-9.9277-7.4649a10.3058 10.3058 0 0 1-.3985-2.8437c0-5.0887 3.6521-9.3404 8.6035-10.164.2214-.037.8885-.1446 1.7246-.1446 4.4166 0 8.269 2.732 9.7305 6.8476.0558.144.0977.293.1465.4395.299.9746.4531 1.9887.4531 3.0215 0 4.5696-2.9413 8.5326-7.3164 9.8613l.4863 1.5996c5.085-1.546 8.4995-6.1518 8.502-11.459 0-1.5491-.2983-2.8706-.6504-3.8926-.0432-.1212-.0873-.2422-.1309-.3633h-.002C21.4577 3.0954 17.0444.0195 11.998.0195ZM8.4336 7.8906c-1.1999 0-2.1747.3852-2.9805 1.1758-.8007.7856-1.205 1.7736-1.205 2.9356 0 1.1544.4068 2.1368 1.205 2.9199.8058.7906 1.7806 1.1738 2.9805 1.1738 1.705 0 3.1556-.955 3.7871-2.4883l.0332-.082-1.6289-.5547c-.168.4563-.7552 1.4883-2.1914 1.4883-.6745 0-1.2437-.2344-1.6934-.6992-.4572-.4699-.6875-1.0632-.6875-1.7578 0-.6998.2253-1.2809.6875-1.7735.4522-.4648 1.019-.7012 1.6934-.7012 1.438 0 2.0238 1.0815 2.1934 1.4883l1.627-.5527-.0333-.084c-.629-1.5358-2.082-2.4883-3.7871-2.4883Z"/>`,
  // Topeng drama (tragedy merah di belakang, comedy hijau di depan) — merepresentasikan "playwright".
  playwright: `<path fill="#D95550" d="M4 9.4C4.3 6.6 6.6 4.4 9.4 4.2c1.9-.1 3.6.6 4.8 1.9.3 2-.1 4.2-1.4 5.9-1.4 1.8-3.6 2.7-5.6 2.3-2.2-.4-3.5-2.5-3.2-4.9Z"/><ellipse cx="7" cy="8.7" rx=".55" ry=".8" fill="#7A2320"/><ellipse cx="10.2" cy="8.3" rx=".55" ry=".8" fill="#7A2320"/><path fill="none" stroke="#7A2320" stroke-width="1" stroke-linecap="round" d="M6.6 12.4c1.2-1 2.8-1 4-.1"/><path fill="#3FAE58" d="M9.8 12.9c.3-2.8 2.6-4.9 5.4-5 2-.1 3.8.7 5 2.1.3 2.1-.2 4.4-1.6 6.1-1.5 1.9-3.8 2.8-5.9 2.3-2.3-.5-3.6-2.7-2.9-5.5Z"/><ellipse cx="13" cy="12.2" rx=".55" ry=".8" fill="#1F6B2E"/><ellipse cx="16.4" cy="11.7" rx=".55" ry=".8" fill="#1F6B2E"/><path fill="none" stroke="#1F6B2E" stroke-width="1" stroke-linecap="round" d="M12.6 16.3c1.4 1.2 3.2 1.2 4.6 0"/>`,
  // Geometri resmi Jest (via simple-icons), warna brand asli.
  jest: `<path fill="#C21325" d="M22.251 11.82a3.117 3.117 0 0 0-2.328-3.01L22.911 0H8.104L11.1 8.838a3.116 3.116 0 0 0-2.244 2.988c0 1.043.52 1.967 1.313 2.536a8.279 8.279 0 0 1-1.084 1.244 8.14 8.14 0 0 1-2.55 1.647c-.834-.563-1.195-1.556-.869-2.446a3.11 3.11 0 0 0-.91-6.08 3.117 3.117 0 0 0-3.113 3.113c0 .848.347 1.626.903 2.182-.048.097-.097.195-.146.299-.465.959-.993 2.043-1.195 3.259-.403 2.432.257 4.384 1.849 5.489A5.093 5.093 0 0 0 5.999 24c1.827 0 3.682-.917 5.475-1.807 1.279-.632 2.599-1.292 3.898-1.612.48-.118.98-.187 1.508-.264 1.07-.153 2.175-.312 3.168-.89a4.482 4.482 0 0 0 2.182-3.091c.174-.994 0-1.994-.444-2.87.298-.48.465-1.042.465-1.647zm-1.355 0c0 .965-.785 1.75-1.75 1.75a1.753 1.753 0 0 1-1.085-3.126l.007-.007c.056-.042.118-.084.18-.125 0 0 .008 0 .008-.007.028-.014.055-.035.083-.05.007 0 .014-.006.021-.006.028-.014.063-.028.097-.042.035-.014.07-.027.098-.041.007 0 .013-.007.02-.007.028-.007.056-.021.084-.028.007 0 .02-.007.028-.007.034-.007.062-.014.097-.02h.007l.104-.022c.007 0 .02 0 .028-.007.028 0 .055-.007.083-.007h.035c.035 0 .07-.007.111-.007h.09c.028 0 .05 0 .077.007h.014c.055.007.111.014.167.028a1.766 1.766 0 0 1 1.396 1.723zM10.043 1.39h10.93l-2.509 7.4c-.104.02-.208.055-.312.09l-2.64-5.385-2.648 5.35c-.104-.034-.216-.055-.327-.076l-2.494-7.38zm4.968 9.825a3.083 3.083 0 0 0-.938-1.668l1.438-2.904 1.452 2.967c-.43.43-.743.98-.868 1.605H15.01zm-3.481-1.098c.034-.007.062-.014.097-.02h.02c.029-.008.056-.008.084-.015h.028c.028 0 .049-.007.076-.007h.271c.028 0 .049.007.07.007.014 0 .02 0 .035.007.027.007.048.007.076.014.007 0 .014 0 .028.007l.097.02h.007c.028.008.056.015.083.029.007 0 .014.007.028.007.021.007.049.014.07.027.007 0 .014.007.02.007.028.014.056.021.084.035h.007a.374.374 0 0 1 .09.049h.007c.028.014.056.034.084.048.007 0 .007.007.013.007.028.014.05.035.077.049l.007.007c.083.062.16.132.236.201l.007.007a1.747 1.747 0 0 1 .48 1.209 1.752 1.752 0 0 1-3.502 0 1.742 1.742 0 0 1 1.32-1.695zm-6.838-.049c.966 0 1.751.786 1.751 1.751s-.785 1.751-1.75 1.751-1.752-.785-1.752-1.75.786-1.752 1.751-1.752zm16.163 6.025a3.07 3.07 0 0 1-1.508 2.133c-.758.438-1.689.577-2.669.716a17.29 17.29 0 0 0-1.64.291c-1.445.355-2.834 1.05-4.182 1.717-1.724.854-3.35 1.66-4.857 1.66a3.645 3.645 0 0 1-2.154-.688c-1.529-1.056-1.453-3.036-1.272-4.12.167-1.015.632-1.966 1.077-2.877.028-.055.049-.104.077-.16.152.056.312.098.479.126-.264 1.473.486 2.994 1.946 3.745l.264.139.284-.104c1.216-.431 2.342-1.133 3.336-2.071a9.334 9.334 0 0 0 1.445-1.716c.16.027.32.034.48.034a3.117 3.117 0 0 0 3.008-2.327h1.167a3.109 3.109 0 0 0 3.01 2.327c.576 0 1.11-.16 1.57-.43.18.52.236 1.063.139 1.605z"/>`,
  // Geometri resmi K6 (via simple-icons) — segitiga "mountain" ungu brand.
  k6: `<path fill="#7D64FF" d="M24 23.646H0L7.99 6.603l4.813 3.538L19.08.354Zm-8.8-3.681h.052a2.292 2.292 0 0 0 1.593-.64 2.088 2.088 0 0 0 .685-1.576 1.912 1.912 0 0 0-.66-1.511 2.008 2.008 0 0 0-1.37-.59h-.04a.716.716 0 0 0-.199.027l1.267-1.883-1.01-.705-.477.705-1.22 1.864c-.21.31-.386.582-.495.77-.112.2-.21.41-.29.625a1.942 1.942 0 0 0-.138.719 2.086 2.086 0 0 0 .676 1.558c.422.411.989.641 1.578.64Zm-5.365-2.027 1.398 1.978h1.496l-1.645-2.295 1.46-2.029-.97-.671-.427.565-1.314 1.853v-3.725l-1.31-1.068v7.37h1.31v-1.98Zm5.367.792a.963.963 0 1 1 0-1.927h.009a.941.941 0 0 1 .679.29.897.897 0 0 1 .29.668.978.978 0 0 1-.977.967Z"/>`,
  // Selenium IDE badge — kotak hijau brand + centang + monogram "Se" (vektor, bukan <text>, agar tidak ikut terekstrak sebagai teks halaman).
  selenium: `<rect x="1.5" y="1.5" width="21" height="21" rx="4.6" fill="#43B02A"/><path fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M6 12.6 9.6 16.4 18.3 6.6"/><path fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M7.6 15.6c-1.3-.5-2.6 0-2.6 1s1.3 1 2.6 1.4c1.3.4 2.6.6 2.6 1.6s-1.3 1.4-2.6 1c-.7-.2-1.3-.6-1.7-1.1"/><path fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M13.2 19.4a2 2 0 1 1 3.9-.6h-3.9a2 2 0 0 0 3.3 1.3"/>`,
  // Batang berwarna khas logo pytest (biru/olive/oranye/merah menurun).
  pytest: `<rect x="2.615" y="0" width="3.84" height=".887" fill="#0A9EDC"/><rect x="7.637" y="0" width="3.842" height=".887" fill="#A9B34D"/><rect x="12.594" y="0" width="3.841" height=".887" fill="#F2994A"/><rect x="17.529" y="0" width="3.842" height=".887" fill="#D6483B"/><path fill="#1F2933" d="M2.447 1.895A.935.935 0 0 0 1.512 2.83C1.512 3.347 1.93 3.768 2.447 3.768H21.553C22.07 3.768 22.488 3.347 22.488 2.83A.935.935 0 0 0 21.553 1.894Z"/><rect x="2.615" y="4.742" width="3.84" height="19.258" fill="#0A9EDC"/><rect x="7.637" y="4.742" width="3.842" height="15.801" fill="#A9B34D"/><rect x="12.594" y="4.742" width="3.849" height="10.549" fill="#F2994A"/><rect x="17.529" y="4.742" width="3.842" height="6.494" fill="#D6483B"/>`,
  // source, ci, collab
  github: `<path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.7.83.58A12 12 0 0 0 12 .3z"/>`,
  gitlab: `<path fill="#E24329" d="M12 21.42 15.68 10.1H8.32z"/><path fill="#FC6D26" d="M12 21.42 8.32 10.1H3.16z"/><path fill="#FCA326" d="M3.16 10.1 2.03 13.56a.77.77 0 0 0 .28.86L12 21.42z"/><path fill="#E24329" d="M3.16 10.1h5.16L6.1 3.28a.39.39 0 0 0-.75 0z"/><path fill="#FC6D26" d="M12 21.42 15.68 10.1h5.16z"/><path fill="#FCA326" d="M20.84 10.1 21.97 13.56a.77.77 0 0 1-.28.86L12 21.42z"/><path fill="#E24329" d="M20.84 10.1h-5.16l2.22-6.82a.39.39 0 0 1 .75 0z"/>`,
  jira: `<defs><linearGradient id="tfjg" x1="98%" y1="0%" x2="36%" y2="46%"><stop offset="0" stop-color="#0052CC"/><stop offset="1" stop-color="#2684FF"/></linearGradient></defs><path fill="#2684FF" d="M11.57 11.51H0a5.22 5.22 0 0 0 5.23 5.22h2.13v2.05A5.22 5.22 0 0 0 12.58 24V12.52a1 1 0 0 0-1.01-1.01z"/><path fill="url(#tfjg)" d="M17.29 5.76H5.74a5.22 5.22 0 0 0 5.21 5.21h2.13v2.06a5.22 5.22 0 0 0 5.22 5.21V6.76a1 1 0 0 0-1.01-1z"/><path fill="url(#tfjg)" d="M23.01 0H11.46a5.22 5.22 0 0 0 5.21 5.22h2.13v2.05A5.22 5.22 0 0 0 24 12.48V1.01A1 1 0 0 0 23.01 0z"/>`,
  slack: `<path fill="#36C5F0" d="M6.2 14.9a2 2 0 1 1-2-2h2zM7.2 14.9a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0z"/><path fill="#2EB67D" d="M9.2 6.1a2 2 0 1 1 2-2v2zM9.2 7.1a2 2 0 1 1 0 4h-5a2 2 0 1 1 0-4z"/><path fill="#ECB22E" d="M17.9 9.1a2 2 0 1 1 2 2h-2zM16.9 9.1a2 2 0 1 1-4 0v-5a2 2 0 1 1 4 0z"/><path fill="#E01E5A" d="M14.9 17.9a2 2 0 1 1-2 2v-2zM14.9 16.9a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4z"/>`,
  jenkins: `<circle cx="12" cy="12" r="11" fill="#fff"/><ellipse cx="12" cy="11" rx="5.3" ry="6.1" fill="#EBD7BE"/><path fill="#2B3A42" d="M6.7 8.4C7.2 4.9 9.3 3 12 3s4.8 1.9 5.3 5.4c-1.8-.7-2.1-2.4-5.3-2.4S8.5 7.7 6.7 8.4Z"/><circle cx="9.9" cy="10.2" r="0.95" fill="#2B3A42"/><circle cx="14.1" cy="10.2" r="0.95" fill="#2B3A42"/><path fill="#4A3B30" d="M8.3 12.8c1.1-.25 2.2-.1 3.7.65 1.5-.75 2.6-.9 3.7-.65-.85 1.7-2.1 2.35-3.7 2.35s-2.85-.65-3.7-2.35Z"/><path fill="#D33833" d="M8.6 18.3 12 16.9 12 19.7Z M15.4 18.3 12 16.9 12 19.7Z"/><circle cx="12" cy="18.3" r=".55" fill="#8C1F1F"/>`,
  // Kotak hitam polos + wajah minimal (bukan warna teal khas brand) — mengikuti referensi visual persis.
  "robot-framework": `<path fill="none" stroke="#1A1A2E" stroke-width="1.6" stroke-linecap="round" d="M12 6.8V4.2"/><circle cx="12" cy="3.2" r="1.4" fill="#1A1A2E"/><rect x="4.8" y="6.8" width="14.4" height="11" rx="3.2" fill="#1A1A2E"/><rect x="7.8" y="10.3" width="3.1" height="3.4" rx="1.1" fill="#fff"/><rect x="13.1" y="10.3" width="3.1" height="3.4" rx="1.1" fill="#fff"/><rect x="9" y="18.6" width="6" height="1.7" rx=".85" fill="#fff"/>`,
  // self-host
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

/* Brand mark "Anvil" — literal terhadap "Forge": siluet landasan solid +
   percikan tempa. Fill-based dua warna (ink + spark), bukan stroke seperti
   TFIcon. Default putih di atas badge indigo (lihat HTML Icon System). */
export function AnvilMark({
  className = "h-6 w-6",
  ink = "#ffffff",
  spark = "#c7d2fe",
}: {
  className?: string;
  ink?: string;
  spark?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <g fill={ink}>
        <rect x="3.8" y="8" width="15" height="3.5" rx="1.1" />
        <path d="M3.8 8.5 1.5 9.75 3.8 11Z" />
        <path d="M9.4 11.5H14.6L17 17.4H7Z" />
        <rect x="6.2" y="16.6" width="11.6" height="1.8" rx="0.7" />
      </g>
      <g stroke={spark} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M17 6.3 19 4.4" />
        <path d="M19.7 8.2 21.7 7.6" />
        <path d="M15 4.8 15.5 2.7" />
      </g>
    </svg>
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
        <AnvilMark className={icon} />
      </span>
      <span className={`font-display font-bold tracking-tight ${text} ${dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
        Test<span className="text-indigo-600 dark:text-indigo-400">Forge</span>
      </span>
    </Link>
  );
}
