import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { loadMyWork } from "@/lib/my-work";
import { caseDisplayId, STATUS_BADGES, PRIORITY_BADGES, RESULT_BADGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const session = await requireSession();
  const { results, cases, reviews } = await loadMyWork(session.userId);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">My Work</h2>
      <p className="text-sm text-content-muted">
        Everything assigned to you across every project you belong to.
      </p>

      <section className="rounded-xl border border-hairline bg-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Results to execute
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-content-muted">
            {results.length}
          </span>
        </h3>
        <ul className="space-y-2 text-sm" data-testid="my-work-results">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2"
              data-testid={`my-work-result-${r.id}`}
            >
              <Link
                href={`/projects/${r.run.project.slug}/runs/${r.run.id}`}
                className="w-0 flex-1 truncate text-content hover:text-accent-text"
              >
                <span className="text-xs text-content-subtle">{r.run.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-content-subtle">
                  {caseDisplayId(r.run.project.slug, r.testCase.seq)}
                </span>{" "}
                {r.testCase.title}
                <span className="text-content-subtle"> — {r.run.name}</span>
              </Link>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_BADGES[r.status] ?? "bg-surface-muted text-content"}`}
              >
                {r.status}
              </span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-content-subtle">Nothing assigned to you in an active run.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Cases assigned to me
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-content-muted">
            {cases.length}
          </span>
        </h3>
        <ul className="space-y-2 text-sm" data-testid="my-work-cases">
          {cases.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2"
              data-testid={`my-work-case-${c.id}`}
            >
              <Link
                href={`/projects/${c.project.slug}/cases/${c.id}`}
                className="w-0 flex-1 truncate text-content hover:text-accent-text"
              >
                <span className="text-xs text-content-subtle">{c.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-content-subtle">
                  {caseDisplayId(c.project.slug, c.seq)}
                </span>{" "}
                {c.title}
              </Link>
              <span className="flex shrink-0 gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}
                >
                  {c.priority}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[c.status] ?? "bg-surface-muted text-content"}`}
                >
                  {c.status}
                </span>
              </span>
            </li>
          ))}
          {cases.length === 0 && (
            <li className="text-content-subtle">No test cases assigned to you.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Reviews requested from me
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-content-muted">
            {reviews.length}
          </span>
        </h3>
        <ul className="space-y-2 text-sm" data-testid="my-work-reviews">
          {reviews.map((c) => (
            <li key={c.id} data-testid={`my-work-review-${c.id}`}>
              <Link
                href={`/projects/${c.project.slug}/cases/${c.id}`}
                className="min-w-0 truncate text-content hover:text-accent-text"
              >
                <span className="text-xs text-content-subtle">{c.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-content-subtle">
                  {caseDisplayId(c.project.slug, c.seq)}
                </span>{" "}
                {c.title}
              </Link>
            </li>
          ))}
          {reviews.length === 0 && (
            <li className="text-content-subtle">No reviews waiting on you.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
