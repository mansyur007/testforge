import Link from "next/link";
import { Logo } from "@/components/icons";
import type { Lang } from "@/lib/i18n";
import { academyChrome, academyPath } from "@/lib/academy/chrome";

/**
 * A-08: the signed-out header the three Academy pages each had a copy of.
 *
 * Extracted because the Indonesian routes made it a fourth, fifth and sixth
 * copy — and because the logo now has to lead somewhere language-appropriate.
 * A-09's rule is unchanged: signed-in readers get `AuthedAppShell` instead, and
 * this is only what an anonymous visitor (or a crawler) sees.
 */
export function AcademyPublicChrome({ lang }: { lang: Lang }) {
  const t = academyChrome[lang];
  return (
    <div className="mb-8 flex items-center justify-between">
      {/* `Logo` renders its own `<Link>` and takes an `href` — wrapping it in
          another one nests `<a>` inside `<a>`, which React reports as a
          hydration error and browsers silently restructure. Pass the
          destination instead. */}
      <Logo href={academyPath(lang)} size="sm" />
      <div className="flex items-center gap-4 text-sm">
        <Link href="/login" className="text-accent-text hover:underline">
          {t.logIn}
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
        >
          {t.signUp}
        </Link>
      </div>
    </div>
  );
}
