"use client";

import { useEffect, useState } from "react";
import { TFIcon } from "@/components/icons";
import { FOCUS_RING } from "@/components/focus";
import { THEMES, type Theme } from "@/lib/theme";
import { applyAppearance, readAppearance } from "@/lib/theme-apply";

const ICON: Record<Theme, string> = { light: "sun", system: "monitor", dark: "moon" };
const LABEL: Record<Theme, string> = { light: "Light", system: "System", dark: "Dark" };

// F-39. The active segment comes from the DOM (data-theme-pref, written by the
// boot script) rather than from props: the server does not know the preference,
// so rendering it from state would either flash the wrong segment or force the
// whole tree dynamic. Initial state is a neutral "system" and the effect
// corrects it on mount — one frame, and only for this 3-button control.
export function ThemeSwitcher({
  tone = "light",
  size = "sm",
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const [pref, setPref] = useState<Theme>("system");

  useEffect(() => {
    setPref(readAppearance().theme);
  }, []);

  // Follow the OS while the preference is "system" — without this, a user whose
  // machine flips to dark at sunset keeps the stale class until a reload.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => apply("system");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref]);

  // F-46: applying a mode is no longer just a class toggle — under the custom
  // palette the accent ramp has to be re-derived for the mode being entered —
  // so both switchers go through the one applier in lib/theme-apply.ts.
  const apply = (next: Theme) => {
    setPref(applyAppearance({ theme: next }).theme);
  };

  const boxPx = size === "md" ? 44 : 36;
  const box = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const icon = size === "md" ? "h-5 w-5" : "h-[18px] w-[18px]";
  const activeIndex = THEMES.indexOf(pref);

  return (
    <div
      className={`relative flex items-center overflow-hidden rounded-lg border text-xs font-medium ${
        tone === "dark" ? "border-sidebar-border" : "border-hairline"
      }`}
      role="group"
      aria-label="Theme"
      data-testid="theme-switcher"
    >
      {/* F-39: the active segment slides into place (state indication + spatial
          consistency) instead of an instant colour swap — a control switched a
          few times a session stays inside the 150–250ms segmented-control
          budget. transform-only, so it stays off the main thread's paint work;
          motion-safe: drops it to an instant jump under prefers-reduced-motion. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 bg-accent motion-safe:transition-transform motion-safe:duration-panel motion-safe:ease-tf-out"
        style={{ width: boxPx, height: boxPx, transform: `translateX(${activeIndex * boxPx}px)` }}
      />
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => apply(t)}
          aria-pressed={pref === t}
          title={LABEL[t]}
          aria-label={LABEL[t]}
          data-testid={`theme-${t}`}
          className={`relative grid place-items-center ${box} ${FOCUS_RING} motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-tf-out ${
            pref === t
              ? "text-white"
              : tone === "dark"
                ? "text-sidebar-fg hover:bg-sidebar-hover"
                : "text-content-muted hover:bg-surface-muted"
          }`}
        >
          <TFIcon name={ICON[t]} current className={icon} />
        </button>
      ))}
    </div>
  );
}
