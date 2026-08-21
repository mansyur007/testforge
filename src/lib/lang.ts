// The language *selection* — the cookie, its name, and how a value resolves to
// a `Lang`. Deliberately a separate module from `./i18n`, which holds the copy.
//
// `i18n.ts` is the public marketing dictionary: landing, auth and docs, in both
// languages, and it is large. Anything a **client** component imports from it
// drags that whole object into the browser bundle, and the three components
// that need to *write* the language cookie are all client components — they
// need six characters of it (`"tf_lang"`) and none of the copy. Splitting the
// selection out is what keeps `import { LANG_COOKIE }` from costing an Academy
// reader the entire landing page's text in two languages. `i18n.ts` re-exports
// everything here, so server code can keep importing from the one place.
//
// Same split, same reason, as `src/lib/academy/chrome.ts` — see its header.

export type Lang = "en" | "id";
export const LANG_COOKIE = "tf_lang";
export const DEFAULT_LANG: Lang = "en";

export function resolveLang(value: string | undefined): Lang {
  return value === "id" ? "id" : "en";
}

/**
 * Remember an explicit language choice for the rest of the site, for a year.
 *
 * Client-only — it touches `document`. Three callers write the same cookie the
 * same way: `LanguageSwitcher` (landing and auth), `AcademyLanguageLink` (the
 * Academy's in-page switch) and `AcademyLangMemory` (arriving on an `/id` URL).
 * One language memory, one place that spells out how it is written.
 */
export function setLangCookie(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
}
