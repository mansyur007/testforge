import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { caseDisplayId, RESULT_COLORS } from "@/lib/constants";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: {
      cases: { where: { deletedAt: null } },
      runs: {
        include: { results: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  const allResults = project.runs.flatMap((r) => r.results);
  const executed = allResults.filter(
    (r) => !["UNTESTED", "IN_PROGRESS"].includes(r.status)
  );
  const passed = executed.filter((r) => r.status === "PASSED").length;
  const failed = executed.filter((r) => r.status === "FAILED").length;
  const passRate = executed.length
    ? Math.round((passed / executed.length) * 100)
    : 0;

  // Automation coverage (PRD §4.5.3)
  const automated = project.cases.filter(
    (c) => c.automationStatus === "AUTOMATED"
  ).length;
  const automationCoverage = project.cases.length
    ? Math.round((automated / project.cases.length) * 100)
    : 0;

  // Flaky test report (PRD §4.5.3): case yang status pass/fail-nya berganti-ganti
  const byCase = new Map<string, { statuses: string[] }>();
  for (const run of [...project.runs].reverse()) {
    for (const r of run.results) {
      if (!["PASSED", "FAILED"].includes(r.status)) continue;
      const entry = byCase.get(r.caseId) ?? { statuses: [] };
      entry.statuses.push(r.status);
      byCase.set(r.caseId, entry);
    }
  }
  const flaky = Array.from(byCase.entries())
    .map(([caseId, { statuses }]) => {
      let flips = 0;
      for (let i = 1; i < statuses.length; i++)
        if (statuses[i] !== statuses[i - 1]) flips++;
      return { caseId, flips, total: statuses.length };
    })
    .filter((f) => f.flips >= 2)
    .sort((a, b) => b.flips - a.flips)
    .slice(0, 10);

  const flakyCases = flaky.map((f) => ({
    ...f,
    testCase: project.cases.find((c) => c.id === f.caseId),
  }));

  // Pass rate trend per run (proxy mingguan untuk MVP)
  const trend = [...project.runs]
    .reverse()
    .slice(-12)
    .map((run) => {
      const ex = run.results.filter((r) =>
        ["PASSED", "FAILED", "BLOCKED", "SKIPPED", "RETEST"].includes(r.status)
      );
      const p = ex.filter((r) => r.status === "PASSED").length;
      return {
        name: run.name,
        rate: ex.length ? Math.round((p / ex.length) * 100) : 0,
        executed: ex.length,
      };
    });

  // Bug correlation (PRD §4.5.2): case dengan defect terbanyak
  const defectCounts = new Map<string, number>();
  allResults.forEach((r) => {
    if (r.defectUrl)
      defectCounts.set(r.caseId, (defectCounts.get(r.caseId) ?? 0) + 1);
  });
  const buggy = Array.from(defectCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([caseId, count]) => ({
      count,
      testCase: project.cases.find((c) => c.id === caseId),
    }));

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="reports" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Pass Rate Keseluruhan", value: `${passRate}%` },
          { label: "Total Eksekusi", value: executed.length },
          { label: "Failed", value: failed },
          { label: "Automation Coverage", value: `${automationCoverage}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">📈 Tren Pass Rate per Run</h3>
        {trend.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada data run.</p>
        ) : (
          <div className="flex h-44 items-end gap-2">
            {trend.map((t, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-600">{t.rate}%</span>
                <div
                  className={`w-full rounded-t ${t.rate >= 80 ? "bg-green-400" : t.rate >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ height: `${Math.max(t.rate, 3)}%` }}
                  title={`${t.name}: ${t.rate}% (${t.executed} eksekusi)`}
                />
                <span className="w-full truncate text-center text-[10px] text-slate-400">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-semibold">🎲 Flaky Tests</h3>
          <p className="mb-3 text-xs text-slate-400">
            Test case yang berganti-ganti status pass/fail antar run (≥2 perubahan).
          </p>
          {flakyCases.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada flaky test terdeteksi. 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {flakyCases.map((f) => (
                <li key={f.caseId} className="flex items-center justify-between">
                  <Link
                    href={`/projects/${project.slug}/cases/${f.caseId}`}
                    className="truncate text-slate-700 hover:text-indigo-600"
                  >
                    <span className="font-mono text-xs text-slate-400">
                      {f.testCase && caseDisplayId(project.slug, f.testCase.seq)}
                    </span>{" "}
                    {f.testCase?.title}
                  </Link>
                  <span className="ml-2 shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {f.flips} flip / {f.total} run
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-semibold">🐛 Bug Correlation</h3>
          <p className="mb-3 text-xs text-slate-400">
            Test case yang paling sering menghasilkan bug report.
          </p>
          {buggy.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada defect yang tercatat.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {buggy.map((b, i) => (
                <li key={i} className="flex items-center justify-between">
                  <Link
                    href={`/projects/${project.slug}/cases/${b.testCase?.id}`}
                    className="truncate text-slate-700 hover:text-indigo-600"
                  >
                    {b.testCase?.title}
                  </Link>
                  <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {b.count} defect
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">📋 Breakdown per Run</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Run</th>
              <th className="py-2">Progress</th>
              <th className="py-2 text-right">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {project.runs.map((run) => {
              const total = run.results.length || 1;
              const ex = run.results.filter(
                (r) => !["UNTESTED", "IN_PROGRESS"].includes(r.status)
              );
              const p = ex.filter((r) => r.status === "PASSED").length;
              return (
                <tr key={run.id}>
                  <td className="py-2">
                    <Link
                      href={`/projects/${project.slug}/runs/${run.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {run.name}
                    </Link>
                  </td>
                  <td className="w-1/2 py-2">
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                      {Object.entries(
                        run.results.reduce<Record<string, number>>((acc, r) => {
                          acc[r.status] = (acc[r.status] ?? 0) + 1;
                          return acc;
                        }, {})
                      ).map(([st, count]) => (
                        <div
                          key={st}
                          className={RESULT_COLORS[st]}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {ex.length ? `${Math.round((p / ex.length) * 100)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
