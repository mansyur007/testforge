import Link from "next/link";
import type { Lang } from "@/lib/i18n";

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
  const label = lang === "id" ? "English" : "Bahasa Indonesia";
  return (
    <Link
      href={target}
      hrefLang={lang === "id" ? "en" : "id"}
      data-testid="academy-language-link"
      className="rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-content-muted hover:bg-surface-muted"
    >
      {label}
    </Link>
  );
}
