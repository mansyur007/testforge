"use client";

import { useCallback, useEffect, useState } from "react";
import { TFIcon } from "@/components/icons";
import { FOCUS_RING, FOCUS_RING_FIELD } from "@/components/focus";
import {
  DEFAULT_ACCENT,
  PALETTES,
  accentTokens,
  normalizeAccent,
  type PaletteId,
  type PaletteSwatch,
} from "@/lib/theme";
import { applyAppearance, readAppearance, resetPalette } from "@/lib/theme-apply";

/* F-46: the palette picker on /settings/appearance.
 *
 * Same shape of problem as ThemeSwitcher, and the same answer: the current
 * value comes from the DOM on mount, not from props, because the server does
 * not know it. What is new here is that each card has to *show* a palette it
 * is not applying, and a palette looks different in light and dark — so the
 * cards render from the swatch table in lib/theme.ts for whichever mode is
 * live, and a MutationObserver on <html class> keeps them honest when the
 * mode is switched from the sidebar (or by the OS, under "System").
 *
 * There is no separate preview pane: applying is instant and reversible, so
 * the honest preview of a palette is the whole app wearing it. The sample row
 * below the grid exists only to put a button, a chip and a link side by side.
 */

const CUSTOM_NEUTRALS = PALETTES.find((p) => p.id === "custom") ?? PALETTES[0];

/** "79 70 229" (token form) -> "rgb(79 70 229)" (paintable form). */
function toCss(channels: string): string {
  return `rgb(${channels})`;
}

function swatchFor(id: PaletteId, accent: string, dark: boolean): PaletteSwatch {
  const meta = PALETTES.find((p) => p.id === id) ?? PALETTES[0];
  const base = dark ? meta.dark : meta.light;
  if (id !== "custom") return base;
  // Custom keeps the default neutrals and derives only its accent, exactly as
  // the runtime does — so the card cannot promise a colour the app will not
  // actually apply (the derivation darkens light picks to keep white text).
  const neutrals = dark ? CUSTOM_NEUTRALS.dark : CUSTOM_NEUTRALS.light;
  return { ...neutrals, accent: toCss(accentTokens(accent, dark)["--tf-accent"]) };
}

function Preview({ swatch }: { swatch: PaletteSwatch }) {
  return (
    <span
      aria-hidden
      className="flex h-16 w-full overflow-hidden rounded-lg border"
      style={{ background: swatch.canvas, borderColor: swatch.border }}
    >
      <span
        className="flex w-1/4 shrink-0 flex-col justify-center gap-1 px-1.5"
        style={{ background: swatch.sidebar }}
      >
        <span className="h-1 rounded-full opacity-70" style={{ background: swatch.accent }} />
        <span className="h-1 w-4/5 rounded-full" style={{ background: "#ffffff", opacity: 0.28 }} />
        <span className="h-1 w-3/5 rounded-full" style={{ background: "#ffffff", opacity: 0.28 }} />
      </span>
      <span className="flex flex-1 items-center p-1.5">
        <span
          className="flex h-full w-full flex-col justify-center gap-1 rounded border px-1.5"
          style={{ background: swatch.surface, borderColor: swatch.border }}
        >
          <span className="h-1 w-2/3 rounded-full" style={{ background: swatch.border }} />
          <span className="h-1 w-1/2 rounded-full" style={{ background: swatch.border }} />
          <span className="h-2 w-1/2 rounded-sm" style={{ background: swatch.accent }} />
        </span>
      </span>
    </span>
  );
}

export function PaletteSwitcher() {
  const [palette, setPalette] = useState<PaletteId>("violet");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [draft, setDraft] = useState(`#${DEFAULT_ACCENT}`);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const current = readAppearance();
    setPalette(current.palette);
    setAccent(current.accent);
    setDraft(`#${current.accent}`);

    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    // The mode can also be changed from the sidebar switcher or by the OS
    // while this page is open; both land on <html class>, so watch that
    // rather than trying to subscribe to every source.
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const choose = useCallback((next: PaletteId) => {
    const applied = applyAppearance({ palette: next });
    setPalette(applied.palette);
  }, []);

  const pickAccent = useCallback((value: string) => {
    setDraft(value);
    const hex = normalizeAccent(value);
    const applied = applyAppearance({ palette: "custom", accent: hex });
    setPalette(applied.palette);
    setAccent(applied.accent);
  }, []);

  const reset = useCallback(() => {
    const applied = resetPalette();
    setPalette(applied.palette);
    setAccent(applied.accent);
    setDraft(`#${applied.accent}`);
  }, []);

  return (
    <div className="space-y-5" data-testid="palette-switcher">
      <div role="radiogroup" aria-label="Colour palette" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PALETTES.map((p) => {
          const active = palette === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              // The visible label is inside a nested <span>, which a role=radio
              // does not take its accessible name from — without this the whole
              // group reads as seven unnamed radios.
              aria-label={p.label}
              onClick={() => choose(p.id)}
              data-testid={`palette-${p.id}`}
              className={`group flex flex-col gap-2 rounded-xl border p-3 text-left ${FOCUS_RING} motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-tf-out ${
                active
                  ? "border-accent bg-accent-soft"
                  : "border-hairline bg-surface hover:border-hairline-strong"
              }`}
            >
              <Preview swatch={swatchFor(p.id, accent, dark)} />
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${active ? "text-accent-soft-fg" : "text-content-strong"}`}
                >
                  {p.label}
                </span>
                {active ? (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                    <TFIcon name="valid" current className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-content-muted">{p.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-muted p-4">
        <label htmlFor="tf-accent" className="text-sm font-medium text-content-strong">
          Custom accent
        </label>
        <input
          id="tf-accent"
          type="color"
          value={draft.startsWith("#") ? draft : `#${normalizeAccent(draft)}`}
          onChange={(e) => pickAccent(e.target.value)}
          data-testid="accent-picker"
          className={`h-9 w-14 cursor-pointer rounded-lg border border-hairline bg-surface p-1 ${FOCUS_RING_FIELD}`}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => pickAccent(e.target.value)}
          spellCheck={false}
          aria-label="Accent colour hex"
          data-testid="accent-hex"
          className={`w-28 rounded-lg border border-hairline bg-surface px-3 py-1.5 font-mono text-sm text-content-strong ${FOCUS_RING_FIELD}`}
        />
        <p className="text-xs text-content-muted">
          Picking a colour switches to the Custom palette. Very light picks are darkened until
          white button text stays readable.
        </p>
        <button
          type="button"
          onClick={reset}
          data-testid="palette-reset"
          className={`ml-auto rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-muted ${FOCUS_RING}`}
        >
          Reset to default
        </button>
      </div>

      {/* Real components, not a mock: whatever these look like is what the rest
          of the app looks like, because they read the same tokens. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface p-4">
        <span className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white">
          Primary button
        </span>
        <span className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-content">
          Secondary
        </span>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-soft-fg">
          Soft chip
        </span>
        <span className="text-sm font-medium text-accent-text">Link text</span>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success-soft-fg">
          Passed
        </span>
        <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger-soft-fg">
          Failed
        </span>
      </div>
    </div>
  );
}
