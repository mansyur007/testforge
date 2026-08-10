// A-01: TestForge QA Academy content types. See docs/QA-ACADEMY.md §2.1 for why
// lessons are TypeScript modules rather than markdown files read from disk: the
// production image ships only .next/, node_modules/ and prisma/, so anything
// that isn't imported doesn't exist in the container.

/**
 * `draft` lessons and tracks are excluded from `generateStaticParams`, from the
 * sitemap, and (for tracks) from the roadmap's clickable cards — a half-written
 * track can be merged without being indexed. See docs/QA-ACADEMY.md §4.
 */
export type ContentStatus = "draft" | "published";

export type Lesson = {
  slug: string;
  title: string;
  /** One sentence. Doubles as the meta description — without it Google writes
   *  the snippet from the sidebar nav (the lesson F-40 learned on help pages). */
  summary: string;
  /** Reading/working time in minutes, written by the author rather than derived
   *  from word count: half of these lessons are exercises, not prose. */
  minutes: number;
  status: ContentStatus;
  /** Marks a lesson whose exercise runs against the Academy sandbox project.
   *  A-01 renders the badge and the "what you'll do" callout; the coach overlay
   *  and the checkers arrive in A-04. */
  sandbox?: boolean;
  /** GitHub-flavored markdown, rendered by <Markdown> (sanitized, no raw HTML). */
  body: string;
};

export type Track = {
  slug: string;
  title: string;
  /** Shown under the title on the roadmap card and the track page. */
  tagline: string;
  /** Where this track takes you, e.g. "Zero → job-ready". Rendered as a chip. */
  level: string;
  /** TFIcon name (src/components/icons.tsx). */
  icon: string;
  status: ContentStatus;
  /** Bullets for "what you'll be able to do" on the track page. */
  outcomes: string[];
  lessons: Lesson[];
};
