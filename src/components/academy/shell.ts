/**
 * One frame for every Academy page, so the block a reader is looking at does
 * not move when they go roadmap → track → lesson.
 *
 * It had moved: the roadmap centred a 768px column while the lesson page used
 * the full width of the shell. That second one was the worse half — the article
 * box stretched to the right edge while the prose inside it stopped at 68ch, so
 * the breadcrumb and the language toggle sat at opposite ends of an invisible
 * box twice the width of the text, and the text read as stranded in the middle
 * of the page.
 *
 * 65rem is not a round number for its own sake: it is exactly what the lesson
 * page spends — a 224px rail, a 48px gutter, and 47rem of prose. The other
 * pages spend the same total on one column, so every page's outer edges land in
 * the same two places.
 *
 * **This lives under `src/components/` on purpose.** Tailwind's `content` globs
 * (tailwind.config.ts) cover `src/pages`, `src/components` and `src/app` — not
 * `src/lib`. A class string parked in `src/lib/academy/chrome.ts`, next to the
 * rest of the Academy's shared chrome, is invisible to the scanner: the utility
 * is never generated, the class name still renders in the HTML, and the page
 * silently lays out as though no max-width had been set at all.
 */
export const ACADEMY_SHELL = "mx-auto w-full max-w-[65rem]";
