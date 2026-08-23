// F-39: theme preference. Cookie-only (no DB column) so it works logged-out on
// the landing, auth and public-share pages — same shape as tf_lang in i18n.ts.
export const THEME_COOKIE = "tf_theme";
export const THEMES = ["light", "system", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "system";

export function resolveTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

/* ------------------------------------------------------------------ *
 * F-46: colour palettes.
 *
 * F-39 made light/dark one axis. This is the second, orthogonal one: the
 * hue of the app. Because every colour in the product already resolves from
 * the --tf-* token block, a palette is nothing but a second block of the
 * same tokens — no component needs per-palette work to wear one.
 *
 * Same storage as the theme: cookies, not a User column. A palette belongs
 * to the screen being looked at, it has to survive logging out (landing,
 * /login and public share links all read it), and a DB round trip would
 * make the pre-paint boot script at the bottom of this file impossible.
 *
 * `violet` is the palette the app shipped with — its values ARE :root/.dark
 * in globals.css, so it deliberately has no override block of its own.
 * ------------------------------------------------------------------ */
export const PALETTE_COOKIE = "tf_palette";
export const ACCENT_COOKIE = "tf_accent";

export const PALETTE_IDS = [
  "violet",
  "ocean",
  "emerald",
  "sunset",
  "rose",
  "graphite",
  "custom",
] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export const DEFAULT_PALETTE: PaletteId = "violet";

/** Accent for the `custom` palette, as a bare 6-digit hex (no `#`). The
 *  default is the violet accent, so Custom opens on the colour already on
 *  screen rather than on an arbitrary one. */
export const DEFAULT_ACCENT = "4f46e5";

/** The five colours a palette card previews — enough to judge a palette
 *  without applying it. Mirrors the CSS block of the same id; kept honest by
 *  scripts/check-palettes.mjs, which fails if a palette exists in one file
 *  and not the other. */
export type PaletteSwatch = {
  canvas: string;
  surface: string;
  border: string;
  sidebar: string;
  accent: string;
};

export type PaletteMeta = {
  id: PaletteId;
  label: string;
  hint: string;
  light: PaletteSwatch;
  dark: PaletteSwatch;
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "violet",
    label: "Violet",
    hint: "The TestForge default — indigo on slate.",
    light: { canvas: "#f8fafc", surface: "#ffffff", border: "#e2e8f0", sidebar: "#0f172a", accent: "#4f46e5" },
    dark: { canvas: "#020617", surface: "#0f172a", border: "#334155", sidebar: "#020617", accent: "#6366f1" },
  },
  {
    id: "ocean",
    label: "Ocean",
    hint: "Cool blues on a deep navy rail.",
    light: { canvas: "#f5fafd", surface: "#ffffff", border: "#d5e7f3", sidebar: "#082f49", accent: "#0369a1" },
    dark: { canvas: "#03101a", surface: "#082030", border: "#163e56", sidebar: "#03101a", accent: "#0284c7" },
  },
  {
    id: "emerald",
    label: "Emerald",
    hint: "Green on forest — the pass-rate palette.",
    light: { canvas: "#f6fbf8", surface: "#ffffff", border: "#d6ebe0", sidebar: "#062921", accent: "#047857" },
    dark: { canvas: "#020f0c", surface: "#06201a", border: "#134034", sidebar: "#020f0c", accent: "#059669" },
  },
  {
    id: "sunset",
    label: "Sunset",
    hint: "Warm orange on roasted charcoal.",
    light: { canvas: "#fdfaf6", surface: "#ffffff", border: "#f1e3d5", sidebar: "#291b14", accent: "#c2410c" },
    dark: { canvas: "#140d09", surface: "#241912", border: "#473427", sidebar: "#140d09", accent: "#ea580c" },
  },
  {
    id: "rose",
    label: "Rose",
    hint: "Crimson on plum, high contrast.",
    light: { canvas: "#fdf8fa", surface: "#ffffff", border: "#f3dce5", sidebar: "#2b0f1b", accent: "#be123c" },
    dark: { canvas: "#15090e", surface: "#26121b", border: "#4a2636", sidebar: "#15090e", accent: "#e11d48" },
  },
  {
    id: "graphite",
    label: "Graphite",
    hint: "No hue at all — ink, paper and one grey.",
    light: { canvas: "#fafafa", surface: "#ffffff", border: "#e4e4e7", sidebar: "#18181b", accent: "#27272a" },
    dark: { canvas: "#09090b", surface: "#18181b", border: "#3f3f46", sidebar: "#09090b", accent: "#52525b" },
  },
  {
    id: "custom",
    label: "Custom",
    hint: "Your own accent colour on the default neutrals.",
    // Neutrals are the violet ones: `custom` overrides only the accent ramp,
    // which is derived at runtime and so cannot live in this table.
    light: { canvas: "#f8fafc", surface: "#ffffff", border: "#e2e8f0", sidebar: "#0f172a", accent: `#${DEFAULT_ACCENT}` },
    dark: { canvas: "#020617", surface: "#0f172a", border: "#334155", sidebar: "#020617", accent: `#${DEFAULT_ACCENT}` },
  },
];

export function paletteMeta(id: PaletteId): PaletteMeta {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function resolvePalette(value: string | undefined): PaletteId {
  return (PALETTE_IDS as readonly string[]).includes(value ?? "")
    ? (value as PaletteId)
    : DEFAULT_PALETTE;
}

/** A bare lower-case 6-digit hex, or the default. Accepts `#abc` and
 *  `#aabbcc` so a value pasted from anywhere works. */
export function normalizeAccent(value: string | undefined | null): string {
  const raw = (value ?? "").trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) return raw.replace(/(.)/g, "$1$1");
  return /^[0-9a-f]{6}$/.test(raw) ? raw : DEFAULT_ACCENT;
}

/** The seven accent tokens `custom` writes inline on <html>. Listed so that
 *  switching away from custom removes exactly what was added, rather than
 *  clearing the whole style attribute. */
export const ACCENT_TOKEN_KEYS = [
  "--tf-accent",
  "--tf-accent-hover",
  "--tf-accent-fg",
  "--tf-accent-text",
  "--tf-accent-soft",
  "--tf-accent-soft-fg",
  "--tf-accent-ring",
] as const;

/**
 * Derives the whole accent ramp from one hex, for one mode.
 *
 * Two hard constraints, both read off the existing code rather than chosen:
 * (1) about a hundred call sites write `bg-accent text-white`, so the accent
 * can never get light enough to lose white text — the loop below darkens
 * until the contrast ratio clears 4.5:1 (light) or 3.5:1 (dark), whatever
 * hue was picked; (2) the output is space-separated RGB channels, because
 * Tailwind resolves every token through `rgb(var(--tf-x) / <alpha-value>)`.
 *
 * MUST stay self-contained — no reference to anything outside its own body.
 * It reaches the browser by being stringified into THEME_BOOT_SCRIPT.
 */
export function accentTokens(hex: string, dark: boolean): Record<string, string> {
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  // sRGB -> HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;

  const clamp = function (v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  };

  // HSL -> "r g b" channel triplet
  const rgb = function (hh: number, ss: number, ll: number) {
    ss = clamp(ss, 0, 1);
    ll = clamp(ll, 0, 1);
    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = ll - c / 2;
    let t = [0, 0, 0];
    if (hh < 60) t = [c, x, 0];
    else if (hh < 120) t = [x, c, 0];
    else if (hh < 180) t = [0, c, x];
    else if (hh < 240) t = [0, x, c];
    else if (hh < 300) t = [x, 0, c];
    else t = [c, 0, x];
    return (
      Math.round((t[0] + m) * 255) +
      " " +
      Math.round((t[1] + m) * 255) +
      " " +
      Math.round((t[2] + m) * 255)
    );
  };

  // WCAG relative luminance of an "r g b" triplet, for the white-text check.
  const lum = function (triplet: string) {
    const p = triplet.split(" ");
    const f = function (v: string) {
      const n = parseInt(v, 10) / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]);
  };

  // Pull the accent into the band that reads as a brand colour at all (a
  // near-black or near-white pick would otherwise vanish), then darken in 2%
  // steps until white text on it is legible.
  const need = dark ? 3.5 : 4.5;
  let base = dark ? clamp(l, 0.34, 0.56) : clamp(l, 0.24, 0.5);
  for (let i = 0; i < 40; i++) {
    if (1.05 / (lum(rgb(h, s, base)) + 0.05) >= need) break;
    base -= 0.02;
  }

  const out: Record<string, string> = {};
  out["--tf-accent"] = rgb(h, s, base);
  out["--tf-accent-hover"] = rgb(h, s, base - 0.07);
  out["--tf-accent-fg"] = "255 255 255";
  out["--tf-accent-text"] = dark ? rgb(h, s * 0.9, 0.76) : rgb(h, s, Math.min(base, 0.44));
  out["--tf-accent-soft"] = dark ? rgb(h, s * 0.55, 0.17) : rgb(h, s * 0.6, 0.94);
  out["--tf-accent-soft-fg"] = dark ? rgb(h, s * 0.7, 0.85) : rgb(h, s, 0.3);
  out["--tf-accent-ring"] = rgb(h, s, base + (dark ? 0.14 : 0.1));
  return out;
}

/** Address-bar / PWA colour per palette: the sidebar, which is the colour
 *  sitting under the browser chrome on every in-app screen. */
const THEME_COLORS: Record<string, [string, string]> = PALETTES.reduce(
  (acc, p) => {
    acc[p.id] = [p.light.sidebar, p.dark.sidebar];
    return acc;
  },
  {} as Record<string, [string, string]>,
);

// Runs blocking in <head> before first paint, so there is no light flash on a
// dark-mode load — and, since F-46, no violet flash before a green one.
// Deliberately NOT server-rendered from cookies(): reading cookies() in the
// root layout would opt the whole app — including the static landing page —
// into dynamic rendering. Kept tiny and wrapped in try/catch because a throw
// here would leave the page unstyled.
function themeBoot(
  derive: (hex: string, dark: boolean) => Record<string, string>,
  colors: Record<string, [string, string]>,
) {
  try {
    const c = document.cookie;
    const tm = c.match(/(?:^|;\s*)tf_theme=(light|dark|system)/);
    const pref = tm ? tm[1] : "system";
    const pm = c.match(/(?:^|;\s*)tf_palette=([a-z]+)/);
    const palette = pm && colors[pm[1]] ? pm[1] : "violet";
    const am = c.match(/(?:^|;\s*)tf_accent=([0-9a-fA-F]{6})/);
    const accent = am ? am[1].toLowerCase() : "4f46e5";
    const dark =
      pref === "dark" ||
      (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const e = document.documentElement;
    e.classList.toggle("dark", dark);
    e.dataset.themePref = pref;
    e.dataset.palette = palette;
    e.dataset.accent = accent;
    if (palette === "custom") {
      const tokens = derive(accent, dark);
      for (const k in tokens) e.style.setProperty(k, tokens[k]);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", colors[palette][dark ? 1 : 0]);
  } catch {
    // A throw here would leave the page unstyled; the default palette is fine.
  }
}

// The boot script is built by stringifying the two functions above rather than
// hand-writing them a second time: the accent maths has to run identically
// before first paint and on every later click, and two hand-kept copies would
// drift silently (a wrong accent is not an error, just a wrong colour). Both
// functions are self-contained, so minification cannot break the trick.
export const THEME_BOOT_SCRIPT = `(${themeBoot.toString()})(${accentTokens.toString()},${JSON.stringify(
  THEME_COLORS,
)});`;
