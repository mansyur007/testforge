import type { ReactNode } from "react";
import type { Session } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { AcademyPublicChrome } from "@/components/academy/PublicChrome";
import { ACADEMY_SHELL } from "@/components/academy/shell";

/**
 * A-09d: the wrapper every Academy page ends with — `AuthedAppShell` for a
 * session, the public chrome for a guest, `ACADEMY_SHELL` for both.
 *
 * The rule is A-09/A-09b's and has not changed; what changed is that it was a
 * copied tail rather than a component. Three pages held identical copies of it
 * and the ISTQB exam sub-tree held none, which is exactly how that sub-tree
 * drifted (A-09c recorded the drift and left it; the owner has since called it
 * a defect). A shared frame is what makes "every Academy page" checkable by
 * reading one file instead of six.
 *
 * **A-08, on why `lang` is here and not on `<html>`:** the root layout owns
 * that tag and cannot see the pathname without introducing middleware, which
 * this app has none of and which would run on every request in the whole
 * product — too much blast radius for an attribute. `lang` on a subtree is
 * exactly what HTML5 defines for a document whose content is in a different
 * language from its default, and screen readers and Google both honour it. The
 * document default stays `en`; the page says what it is. It defaults to `en`
 * here for the English-only surfaces — the exam simulator is one (§7.2) — so
 * those pages do not have to say so.
 */
export function AcademyFrame({
  session,
  lang = "en",
  children,
}: {
  session: Session | null;
  lang?: Lang;
  children: ReactNode;
}) {
  if (session) {
    return (
      <AuthedAppShell session={session}>
        <div lang={lang} className={ACADEMY_SHELL}>
          {children}
        </div>
      </AuthedAppShell>
    );
  }

  return (
    <main lang={lang} className={`${ACADEMY_SHELL} px-4 py-12`}>
      <AcademyPublicChrome lang={lang} />
      {children}
    </main>
  );
}
