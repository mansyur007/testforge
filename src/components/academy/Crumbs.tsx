import Link from "next/link";

/**
 * A-09d: the ruled breadcrumb line the track and lesson pages open with, for
 * the pages that had a `Logo` + "Back to …" header instead.
 *
 * Inside the app shell a standalone logo is a second logo, and the back link
 * was the only way out of the exam sub-tree — which is why it cannot simply be
 * dropped when the header goes. A breadcrumb is the same navigation in the form
 * the rest of the Academy already uses, and it says where the reader is as well
 * as where they can go back to.
 *
 * The last entry is the current page and carries no link. Mirrors the markup in
 * `TrackPage`/`LessonPage` rather than abstracting it out of them: those two
 * also host the language toggle in this row, and the exam sub-tree has no
 * Indonesian sibling to toggle to.
 */
export function AcademyCrumbs({
  trail,
}: {
  trail: { name: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center justify-between gap-3 border-b border-hairline pb-3"
    >
      <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
        {trail.map((c, i) => (
          <span key={c.name} className="flex min-w-0 items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-accent-text">
                {c.name}
              </Link>
            ) : (
              <span className="truncate text-content-strong" aria-current="page">
                {c.name}
              </span>
            )}
          </span>
        ))}
      </p>
    </nav>
  );
}
