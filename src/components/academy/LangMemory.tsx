"use client";

import { useEffect } from "react";
import { setLangCookie, type Lang } from "@/lib/lang";

/**
 * Remembers that this reader is reading in Indonesian, for the parts of the
 * site the Academy's URLs cannot speak for.
 *
 * A-08 made the Academy's language a property of the *path* (`/id/academy/**`)
 * and left `tf_lang` governing everything else — landing, login, signup, the
 * self-hosting doc. Nothing connected the two, so the reader's language kept
 * resetting the moment they crossed between them: arrive on an Indonesian
 * lesson from a search result, click "Masuk", and the login page has never
 * heard of your language and renders in English.
 *
 * **Only `id` is written, and that asymmetry is on purpose.** Reading an `/id`
 * URL is always evidence of a preference — you followed an Indonesian link,
 * picked the switch, or clicked an Indonesian search result. Reading `/academy`
 * is not: it is the default path, and a reader who has chosen Indonesian can
 * still land on it from an old link or a shared URL. Writing `en` there would
 * silently undo a choice they made on purpose, which is the same bug in the
 * other direction. Nothing needs to write `en` anyway — `LanguageSwitcher` and
 * `AcademyLanguageLink` both do, on an actual click, and with the entry points
 * now honouring the cookie an Indonesian reader stops arriving at `/academy`
 * by accident in the first place.
 *
 * Renders nothing, and never re-renders the page: `tf_lang` is read on the
 * server, so this only changes what the *next* navigation is served.
 */
export function AcademyLangMemory({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (lang === "id") setLangCookie("id");
  }, [lang]);
  return null;
}
