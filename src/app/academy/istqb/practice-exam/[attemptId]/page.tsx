import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/icons";
import { ISTQB_DISCLAIMER } from "@/content/academy";
import { getExamAttempt } from "@/app/actions/academy";

// A-06: the persisted, session-scoped result view — what `submitExamAction`
// redirects a signed-in learner to. Dynamic (a real DB read, and requires a
// session per the route table in docs/QA-ACADEMY.md), unlike the rest of
// Academy. There is no anonymous variant of this route in this work order:
// an anonymous submission renders its result inline on the exam page itself
// instead of navigating anywhere, which is the interpretation this session
// took of the route table's "session or signed ticket" auth — see the A-06
// entry in docs/QA-ACADEMY.md for why.

export default async function ExamAttemptPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const attempt = await getExamAttempt(params.attemptId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/academy/me" className="text-sm text-accent-text hover:underline">
          My progress
        </Link>
      </div>

      {"error" in attempt ? (
        notFound()
      ) : (
        <>
          <h1 className="text-2xl font-bold text-content-strong sm:text-3xl">
            {attempt.templateSlug === "ctfl-v4-full" ? "Practice exam result" : "Chapter quiz result"}
          </h1>

          <div
            data-testid="exam-attempt-headline"
            className={`mt-6 rounded-2xl border p-6 ${
              attempt.passed
                ? "border-success-border bg-success-soft"
                : "border-danger-border bg-danger-soft"
            }`}
          >
            <p
              className={`text-lg font-semibold ${
                attempt.passed ? "text-success-soft-fg" : "text-danger-soft-fg"
              }`}
            >
              {attempt.passed ? "Pass" : "Not a pass"} — {attempt.score} / {attempt.total}
            </p>
            <p className="mt-1 text-sm text-content-muted">
              Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}
            </p>
          </div>

          {/* A-07: the certificate this attempt earned. Only the full paper
              earns one, and `certificateSerial` is null when the holder has
              turned its link off — so this block is absent rather than
              offering a link that would 404. */}
          {attempt.certificateSerial && (
            <div
              data-testid="exam-attempt-certificate"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-ring bg-accent-soft p-6"
            >
              <div>
                <p className="font-semibold text-content-strong">
                  You&rsquo;ve earned a certificate
                </p>
                <p className="mt-1 text-sm text-content-muted">
                  A public page anyone with the link can read. Turn the link off
                  any time from My progress.
                </p>
              </div>
              <Link
                href={`/academy/certificate/${attempt.certificateSerial}`}
                className="min-h-[44px] shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                View certificate
              </Link>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-hairline bg-surface p-6">
            <h2 className="font-semibold text-content-strong">Per-chapter breakdown</h2>
            <ul className="mt-3 space-y-2">
              {Object.entries(attempt.chapterScores)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([chapter, s]) => {
                  const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <li key={chapter} data-testid={`exam-attempt-chapter-bar-${chapter}`}>
                      <div className="flex items-center justify-between text-xs text-content-muted">
                        <span>Chapter {chapter}</span>
                        <span>
                          {s.correct}/{s.total}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-surface-muted">
                        <div
                          className={`h-2 rounded-full ${pct >= 65 ? "bg-success" : "bg-danger"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-hairline bg-surface p-6">
            <h2 className="font-semibold text-content-strong">Full review</h2>
            <ol className="mt-3 space-y-4">
              {attempt.review.map((v, i) => (
                <li key={v.id} data-testid={`exam-attempt-review-${v.id}`}>
                  <p className="text-sm font-medium text-content-strong">
                    {i + 1}. {v.stem}
                  </p>
                  {!v.withdrawn && (
                    <>
                      <p className="mt-1 text-xs text-content-muted">
                        Your answer: {v.chosenIds.length ? v.chosenIds.join(", ") : "(none)"} ·
                        Correct: {v.correctChoiceIds.join(", ")}
                      </p>
                      <p
                        className={`mt-1 rounded-lg p-2 text-sm ${
                          v.correct
                            ? "bg-success-soft text-success-soft-fg"
                            : "bg-danger-soft text-danger-soft-fg"
                        }`}
                      >
                        {v.explanation}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href="/academy/istqb/practice-exam"
              className="min-h-[44px] rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
            >
              Try again
            </Link>
            <Link
              href="/academy/me"
              className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              My progress
            </Link>
          </div>

          <p className="mt-10 text-xs leading-relaxed text-content-muted">
            {ISTQB_DISCLAIMER}
          </p>
        </>
      )}
    </main>
  );
}
