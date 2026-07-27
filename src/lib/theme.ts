// F-39: theme preference. Cookie-only (no DB column) so it works logged-out on
// the landing, auth and public-share pages — same shape as tf_lang in i18n.ts.
export const THEME_COOKIE = "tf_theme";
export const THEMES = ["light", "system", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "system";

export function resolveTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs blocking in <head> before first paint, so there is no light flash on a
// dark-mode load. Deliberately NOT server-rendered from cookies(): reading
// cookies() in the root layout would opt the whole app — including the static
// landing page — into dynamic rendering. Kept tiny and wrapped in try/catch
// because a throw here would leave the page unstyled.
export const THEME_BOOT_SCRIPT = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)tf_theme=(light|dark|system)/);
var p=m?m[1]:"system";
var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
var e=document.documentElement;
e.classList.toggle("dark",d);
e.dataset.themePref=p;
var t=document.querySelector('meta[name="theme-color"]');
if(t)t.setAttribute("content",d?"#020617":"#0f172a");
}catch(e){}})();`;
