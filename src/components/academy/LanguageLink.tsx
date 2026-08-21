"use client";

import Link from "next/link";
// `@/lib/lang`, not `@/lib/i18n` — see that module's header. This component
// renders on every Academy page, so importing the landing dictionary here would
// ship it to every Academy reader.
import { setLangCookie, type Lang } from "@/lib/lang";

/**
 * A-08: the in-page switch between an Academy page and its sibling in the other
 * language.
 *
 * **Not `LanguageSwitcher`.** That component sets the `tf_lang` cookie and calls
 * `router.refresh()`, which is right for the landing page — one URL, two
 * renderings. The Academy's two languages are two *URLs*, because that is the
 * entire point of A-08: a cookie is invisible to a crawler, so Google would only
 * ever index one of them. Here the switch has to be a real link to a real path,
 * and it renders only when the sibling actually exists — offering a language
 * that 404s is worse than not offering it.
 *
 * `hrefLang` on the anchor is a hint to crawlers; the authoritative pair is the
 * `alternates.languages` metadata (`bilingual`/`bilingualId` in src/lib/seo.ts).
 *
 * **It also writes `tf_lang` (`setLangCookie`), and that is not a contradiction
 * of the above.**
 * The href is still what decides which page you get, so a crawler — which never
 * fires `onClick` — sees exactly the same two URLs it saw before. The cookie is
 * for the half of the site that is *not* the Academy: the landing page and every
 * auth page render from `tf_lang` (`src/lib/i18n.ts`), and before this they had
 * no way to learn that the reader had just chosen Indonesian. Choosing a
 * language here and then being handed an English login page is the bug this
 * fixes; the write is what makes the choice mean something once you leave.
 */
export function AcademyLanguageLink({
  lang,
  enPath,
}: {
  /** The language of the page this link is rendered *on*. */
  lang: Lang;
  /** The English path, e.g. `/academy/fundamentals/bug-reports`. */
  enPath: string;
}) {
  const target = lang === "id" ? enPath : `/id${enPath}`;
  const to: Lang = lang === "id" ? "en" : "id";
  const label = lang === "id" ? "English" : "Bahasa Indonesia";
  return (
    <Link
      href={target}
      hrefLang={to}
      data-testid="academy-language-link"
      onClick={() => setLangCookie(to)}
      className="rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-content-muted hover:bg-surface-muted"
    >
      {label}
    </Link>
  );
}
