import Link from "next/link";
import { TFIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  caseDisplayId,
  parseTags,
  PRIORITY_BADGES,
  RESULT_BADGES,
  type TestStep,
} from "@/lib/constants";
import { cloneCase, deleteCase } from "@/app/actions/cases";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: { slug: string; caseId: string };
}) {
  await requireSession();
  const testCase = await db.testCase.findUnique({
    where: { id: params.caseId },
    include: {
      project: true,
      suite: true,
      results: {
        include: { run: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
    },
  });
  if (!testCase || testCase.project.slug !== params.slug) notFound();

  const steps: TestStep[] = JSON.parse(testCase.stepsJson || "[]");
  const displayId = caseDisplayId(testCase.project.slug, testCase.seq);

  // Trend pass/fail per case (PRD §4.4.2)
  const executed = testCase.results.filter((r) =>
    ["PASSED", "FAILED"].includes(r.status)
  );
  const passCount = executed.filter((r) => r.status === "PASSED").length;

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={testCase.project.slug}
        name={testCase.project.name}
        active="cases"
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-slate-400">{displayId}</p>
          <h2 className="text-xl font-bold">{testCase.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGES[testCase.priority]}`}>
              {testCase.priority}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.type}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {testCase.automationStatus.replace(/_/g, " ")}
            </span>
            {testCase.suite && (
              <span className="flex items-center gap-1 text-slate-400"><TFIcon name="nav-tree" className="h-4 w-4" /> {testCase.suite.name}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/projects/${testCase.project.slug}/cases/${testCase.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            <TFIcon name="edit" className="h-4 w-4" /> Edit
          </Link>
          <form action={cloneCase}>
            <input type="hidden" name="caseId" value={testCase.id} />
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              <TFIcon name="clone" className="h-4 w-4" /> Clone
            </button>
          </form>
          <form action={deleteCase}>
            <input type="hidden" name="caseId" value={testCase.id} />
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              <TFIcon name="delete" current className="h-4 w-4" /> Hapus
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {testCase.description && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-slate-400">
                Deskripsi
              </h3>
              <p className="whitespace-pre-wrap text-sm">{testCase.description}</p>
            </section>
          )}
          {testCase.preconditions && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase text-slate-400">
                Preconditions
              </h3>
              <p className="whitespace-pre-wrap text-sm">{testCase.preconditions}</p>
            </section>
          )}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
              Steps to Reproduce
            </h3>
            {steps.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada step.</p>
            )}
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  <div className="grid flex-1 gap-2 md:grid-cols-2">
                    <p className="whitespace-pre-wrap">{step.action}</p>
                    <p className="whitespace-pre-wrap text-slate-500">
                      {step.expected && <>↳ {step.expected}</>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {testCase.expectedResult && (
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm">
                <span className="font-medium text-green-800">Expected Result: </span>
                <span className="whitespace-pre-wrap text-green-900">
                  {testCase.expectedResult}
                </span>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
              Riwayat Eksekusi
            </h3>
            {executed.length > 0 && (
              <p className="mb-3 text-sm">
                Pass rate:{" "}
                <span className="font-bold">
                  {Math.round((passCount / executed.length) * 100)}%
                </span>{" "}
                <span className="text-slate-400">
                  ({passCount}/{executed.length} eksekusi)
                </span>
              </p>
            )}
            <ul className="space-y-2">
              {testCase.results.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/projects/${testCase.project.slug}/runs/${r.runId}`}
                    className="truncate text-slate-600 hover:text-indigo-600"
                  >
                    {r.run.name}
                  </Link>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_BADGES[r.status]}`}>
                    {r.status}
                  </span>
                </li>
              ))}
              {testCase.results.length === 0 && (
                <p className="text-sm text-slate-400">
                  Belum pernah dieksekusi dalam test run.
                </p>
              )}
            </ul>
          </section>

          {parseTags(testCase.tags).length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {parseTags(testCase.tags).map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {testCase.linkedIssues && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">
                Linked Issues
              </h3>
              <ul className="space-y-1 text-sm">
                {testCase.linkedIssues.split(",").map((url) => (
                  <li key={url}>
                    <a
                      href={url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-indigo-600 hover:underline"
                    >
                      {url.trim()}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
