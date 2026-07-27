"use client";

import { useEffect, useState } from "react";
import { TFIcon } from "@/components/icons";
import { FOCUS_RING } from "@/components/focus";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

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
    setPref((document.documentElement.dataset.themePref as Theme) ?? "system");
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

  const apply = (next: Theme) => {
    const dark =
      next === "dark" ||
      (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const el = document.documentElement;
    el.classList.toggle("dark", dark);
    el.dataset.themePref = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#020617" : "#0f172a");
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    setPref(next);
  };

  const box = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const icon = size === "md" ? "h-5 w-5" : "h-[18px] w-[18px]";

  return (
    <div
      className={`flex items-center overflow-hidden rounded-lg border text-xs font-medium ${
        tone === "dark" ? "border-sidebar-border" : "border-hairline"
      }`}
      role="group"
      aria-label="Theme"
      data-testid="theme-switcher"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => apply(t)}
          aria-pressed={pref === t}
          title={LABEL[t]}
          aria-label={LABEL[t]}
          data-testid={`theme-${t}`}
          className={`grid place-items-center ${box} ${FOCUS_RING} ${
            pref === t
              ? "bg-accent text-white"
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
