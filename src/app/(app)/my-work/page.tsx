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
      <p className="text-sm text-slate-500">
        Everything assigned to you across every project you belong to.
      </p>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Results to execute
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
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
                className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
              >
                <span className="text-xs text-slate-400">{r.run.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-slate-400">
                  {caseDisplayId(r.run.project.slug, r.testCase.seq)}
                </span>{" "}
                {r.testCase.title}
                <span className="text-slate-400"> — {r.run.name}</span>
              </Link>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_BADGES[r.status] ?? "bg-slate-100 text-slate-600"}`}
              >
                {r.status}
              </span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-slate-400">Nothing assigned to you in an active run.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Cases assigned to me
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
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
                className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
              >
                <span className="text-xs text-slate-400">{c.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-slate-400">
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
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[c.status] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {c.status}
                </span>
              </span>
            </li>
          ))}
          {cases.length === 0 && (
            <li className="text-slate-400">No test cases assigned to you.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          Reviews requested from me
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
            {reviews.length}
          </span>
        </h3>
        <ul className="space-y-2 text-sm" data-testid="my-work-reviews">
          {reviews.map((c) => (
            <li key={c.id} data-testid={`my-work-review-${c.id}`}>
              <Link
                href={`/projects/${c.project.slug}/cases/${c.id}`}
                className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
              >
                <span className="text-xs text-slate-400">{c.project.name} ·</span>{" "}
                <span className="font-mono text-xs text-slate-400">
                  {caseDisplayId(c.project.slug, c.seq)}
                </span>{" "}
                {c.title}
              </Link>
            </li>
          ))}
          {reviews.length === 0 && (
            <li className="text-slate-400">No reviews waiting on you.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
