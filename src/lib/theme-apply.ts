import {
  ACCENT_COOKIE,
  ACCENT_TOKEN_KEYS,
  DEFAULT_ACCENT,
  PALETTE_COOKIE,
  PALETTES,
  THEME_COOKIE,
  accentTokens,
  normalizeAccent,
  resolvePalette,
  resolveTheme,
  type PaletteId,
  type Theme,
} from "@/lib/theme";

/* F-46: the browser half of the appearance system — one function that puts a
 * choice on screen, and one that reads back what is currently on screen.
 *
 * The three controls (mode, palette, custom accent) are not independent at
 * apply time: a custom accent has a light ramp and a dark ramp, so flipping
 * the *mode* has to re-derive the *accent*. Before this file the switcher
 * owned its own copy of "apply", and a second control would have meant a
 * second copy of that coupling. Everything is read back from the DOM rather
 * than held in React state for the reason F-39 gave: the server does not know
 * the preference, so state would either flash the wrong value or force the
 * tree dynamic. The <head> boot script is what writes it there first.
 */

export type Appearance = { theme: Theme; palette: PaletteId; accent: string };

const YEAR = 31536000;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${YEAR};samesite=lax`;
}

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function isDarkFor(theme: Theme): boolean {
  return theme === "dark" || (theme === "system" && prefersDark());
}

/** What the document is wearing right now, as written by the boot script. */
export function readAppearance(): Appearance {
  const d = document.documentElement.dataset;
  return {
    theme: resolveTheme(d.themePref),
    palette: resolvePalette(d.palette),
    accent: normalizeAccent(d.accent),
  };
}

/**
 * Applies a partial change on top of what is already on screen, writes the
 * cookies for the parts that changed, and returns the resulting appearance.
 * Called with no argument it re-applies the current one — which is how the
 * "system" mode follows an OS colour-scheme flip.
 */
export function applyAppearance(next: Partial<Appearance> = {}): Appearance {
  const current = readAppearance();
  const a: Appearance = { ...current, ...next };
  const el = document.documentElement;
  const dark = isDarkFor(a.theme);

  el.classList.toggle("dark", dark);
  el.dataset.themePref = a.theme;
  el.dataset.palette = a.palette;
  el.dataset.accent = a.accent;

  // Presets live in globals.css and are selected by the data attribute above;
  // only `custom` is computed, and its tokens go on inline so they outrank
  // whichever block the cascade would otherwise pick.
  for (const key of ACCENT_TOKEN_KEYS) el.style.removeProperty(key);
  if (a.palette === "custom") {
    const tokens = accentTokens(a.accent, dark);
    for (const [key, value] of Object.entries(tokens)) el.style.setProperty(key, value);
  }

  const meta = PALETTES.find((p) => p.id === a.palette) ?? PALETTES[0];
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? meta.dark.sidebar : meta.light.sidebar);

  if (a.theme !== current.theme || next.theme) writeCookie(THEME_COOKIE, a.theme);
  if (a.palette !== current.palette || next.palette) writeCookie(PALETTE_COOKIE, a.palette);
  if (a.accent !== current.accent || next.accent) writeCookie(ACCENT_COOKIE, a.accent);

  return a;
}

/** Back to the shipped look: system mode is left alone, since "which palette"
 *  and "light or dark" are separate choices and only one of them is on this
 *  page as a reset. */
export function resetPalette(): Appearance {
  return applyAppearance({ palette: "violet", accent: DEFAULT_ACCENT });
}
