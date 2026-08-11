import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/icons";
import { BetaChip } from "@/components/BetaChip";
import { ExamRunner } from "@/components/academy/ExamRunner";
import { ISTQB_DISCLAIMER } from "@/content/academy";
import { CHAPTER_QUIZZES } from "@/content/academy/exams";
import { canonical, INDEXABLE } from "@/lib/seo";

// A-06: the six untimed chapter quizzes, reusing the exam engine with a
// single-chapter blueprint (docs/QA-ACADEMY.md §5.2). `dynamicParams = false`
// gives the same "no route at all for anything not listed" guarantee A-01
// established for draft lessons — there is no seventh chapter.

export function generateStaticParams() {
  return CHAPTER_QUIZZES.map((q) => ({ chapter: String(q.chapters[0].chapter) }));
}
export const dynamicParams = false;

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

export default function ChapterQuizPage({ params }: { params: { chapter: string } }) {
  const quiz = findQuiz(params.chapter);
  if (!quiz) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/academy/istqb/practice-exam"
          className="text-sm text-accent-text hover:underline"
        >
          Back to the practice exam
        </Link>
      </div>

      <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-content-strong sm:text-3xl">
        {quiz.title}
        <BetaChip className="translate-y-0.5" />
      </h1>
      <p className="mt-2 text-sm text-content">
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
    </main>
  );
}
