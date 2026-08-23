import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { BetaChip } from "@/components/BetaChip";
import { JsonLd } from "@/components/JsonLd";
import { AcademyFrame } from "@/components/academy/Frame";
import { AcademyCrumbs } from "@/components/academy/Crumbs";
import { ExamRunner } from "@/components/academy/ExamRunner";
import { ISTQB_DISCLAIMER } from "@/content/academy";
import { CTFL_V4_FULL, CHAPTER_QUIZZES } from "@/content/academy/exams";
import { academyChrome } from "@/lib/academy/chrome";
import { breadcrumbLd, canonical, INDEXABLE, ldGraph } from "@/lib/seo";

// A-06: the full ISTQB Foundation practice exam. Public, dynamic (the server
// draws and signs a fresh paper on every "Begin"), per docs/QA-ACADEMY.md's
// route map. Chapter quizzes are linked from here rather than getting their
// own top-level nav entry — they're a drill before this, not a separate
// destination.
//
// A-09d: and it wears the Academy's frame, like every other Academy page. It
// reads the session for that, which is what makes the route dynamic in the
// Next sense too — stated rather than left to the cookie read to imply.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "A free, timed 40-question Foundation Level practice exam aligned to the CTFL v4.0 syllabus, with a per-chapter score breakdown. No account needed to take it.";

export const metadata: Metadata = {
  title: "Foundation Level Practice Exam (CTFL v4.0) — TestForge QA Academy",
  description: DESCRIPTION,
  alternates: canonical("/academy/istqb/practice-exam"),
  robots: INDEXABLE,
  openGraph: {
    type: "website",
    siteName: "TestForge",
    url: "/academy/istqb/practice-exam",
    title: "Foundation Level Practice Exam",
    description: DESCRIPTION,
  },
};

export default async function PracticeExamPage() {
  const session = await getSession();

  return (
    <AcademyFrame session={session}>
      <JsonLd
        data={ldGraph(
          breadcrumbLd([
            { name: "TestForge", path: "/" },
            { name: "QA Academy", path: "/academy" },
            { name: "Foundation Level Practice Exam", path: "/academy/istqb/practice-exam" },
          ]),
        )}
      />

      <AcademyCrumbs
        trail={[
          { name: academyChrome.en.brand, href: "/academy" },
          { name: "Practice exam" },
        ]}
      />

      <h1 className="mt-9 flex flex-wrap items-center gap-3 font-display text-[34px] font-bold leading-none tracking-tight text-content-strong sm:text-[40px]">
        Foundation Level Practice Exam
        <BetaChip className="translate-y-0.5" />
      </h1>
      <p className="mt-4 text-[15px] text-content">
        Aligned to the CTFL v4.0 syllabus. Not an ISTQB product — see the
        disclaimer below.
      </p>

      <p className="mt-6 text-[15px] text-content-muted">
        Want to drill one chapter first?{" "}
        {CHAPTER_QUIZZES.map((q, i) => (
          <span key={q.slug}>
            <Link
              href={`/academy/istqb/practice-exam/chapter/${q.chapters[0].chapter}`}
              data-testid={`chapter-quiz-link-${q.chapters[0].chapter}`}
              className="text-accent-text hover:underline"
            >
              Ch {q.chapters[0].chapter}
            </Link>
            {i < CHAPTER_QUIZZES.length - 1 ? " · " : ""}
          </span>
        ))}
      </p>

      <div className="mt-8">
        <ExamRunner
          templateSlug={CTFL_V4_FULL.slug}
          title={CTFL_V4_FULL.title}
          timed={CTFL_V4_FULL.timed}
          chapters={CTFL_V4_FULL.chapters}
          passPct={CTFL_V4_FULL.passPct}
          baseDurationSec={CTFL_V4_FULL.durationSec}
          extraTimeSec={CTFL_V4_FULL.extraTimeSec}
          resumePath="/academy"
        />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-content-muted">
        {ISTQB_DISCLAIMER}
      </p>
    </AcademyFrame>
  );
}
