import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { BetaChip } from "@/components/BetaChip";
import { AcademyFrame } from "@/components/academy/Frame";
import { AcademyCrumbs } from "@/components/academy/Crumbs";
import { ExamRunner } from "@/components/academy/ExamRunner";
import { ISTQB_DISCLAIMER } from "@/content/academy";
import { CHAPTER_QUIZZES } from "@/content/academy/exams";
import { academyChrome } from "@/lib/academy/chrome";
import { canonical, INDEXABLE } from "@/lib/seo";

// A-06: the six untimed chapter quizzes, reusing the exam engine with a
// single-chapter blueprint (docs/QA-ACADEMY.md §5.2).
//
// A-09d: `generateStaticParams` / `dynamicParams = false` are gone, for the
// reason A-09b gives for the track and lesson pages — reading the session
// forces dynamic rendering, and the two cannot coexist. Neither was what
// produced the 404 for a seventh chapter: `findQuiz()` already returns
// undefined and this page already calls `notFound()`. The guarantee is
// unchanged, now evaluated per request rather than against a build-time list.
export const dynamic = "force-dynamic";

function findQuiz(chapterParam: string) {
  const chapter = Number(chapterParam);
  return CHAPTER_QUIZZES.find((q) => q.chapters[0].chapter === chapter);
}

export function generateMetadata({ params }: { params: { chapter: string } }): Metadata {
  const quiz = findQuiz(params.chapter);
  if (!quiz) return {};
  return {
    title: `${quiz.title} — TestForge QA Academy`,
    description: `An untimed, 8-question drill on ${quiz.chapters[0].topic}, aligned to the CTFL v4.0 syllabus.`,
    alternates: canonical(`/academy/istqb/practice-exam/chapter/${quiz.chapters[0].chapter}`),
    robots: INDEXABLE,
  };
}

export default async function ChapterQuizPage({ params }: { params: { chapter: string } }) {
  const quiz = findQuiz(params.chapter);
  if (!quiz) notFound();

  const session = await getSession();

  return (
    <AcademyFrame session={session}>
      <AcademyCrumbs
        trail={[
          { name: academyChrome.en.brand, href: "/academy" },
          { name: "Practice exam", href: "/academy/istqb/practice-exam" },
          { name: `Chapter ${quiz.chapters[0].chapter}` },
        ]}
      />

      <h1 className="mt-9 flex flex-wrap items-center gap-3 font-display text-[34px] font-bold leading-none tracking-tight text-content-strong sm:text-[40px]">
        {quiz.title}
        <BetaChip className="translate-y-0.5" />
      </h1>
      <p className="mt-4 text-[15px] text-content">
        Untimed. Aligned to the CTFL v4.0 syllabus — not an ISTQB product.
      </p>

      <div className="mt-8">
        <ExamRunner
          templateSlug={quiz.slug}
          title={quiz.title}
          timed={quiz.timed}
          chapters={quiz.chapters}
          passPct={quiz.passPct}
          baseDurationSec={quiz.durationSec}
          resumePath="/academy/istqb/practice-exam"
        />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-content-muted">
        {ISTQB_DISCLAIMER}
      </p>
    </AcademyFrame>
  );
}
