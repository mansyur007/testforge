import Link from "next/link";
import type { Metadata } from "next";
import { caseDisplayId } from "@/lib/constants";
import {
  publicMetadata,
  requirePublicProject,
  requireSection,
} from "@/lib/public-share";
import { loadPublicReport } from "@/lib/public-runs";

// F-38 Part B: public quality report. Aggregates only — no per-result row, no
// muted-tests panel (mutedReason is internal free text and the panel's buttons
// are mutations), no bug-correlation panel (it is built from defectUrl).
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "reports");
  return publicMetadata(project, {
    title: "Quality report",
    description: `Pass rate and automation coverage for ${project.name}, published with TestForge.`,
  });
}

export default async function PublicReportsPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "reports");

  const report = await loadPublicReport(project.id, project.share.showCases);
  const { totals } = report;
  const pct = (n: number | null) => (n === null ? "—" : `${n}%`);

  const tiles = [
    { label: "Overall pass rate", value: pct(totals.passRate), testid: "public-report-pass-rate" },
    { label: "Total executions", value: String(totals.executed), testid: "public-report-executions" },
    { label: "Failed", value: String(totals.failed), testid: "public-report-failed" },
    {
      label: "Automation coverage",
      value: pct(totals.automationCoverage),
      testid: "public-report-automation",
    },
  ];

  return (
    <>
      <h1 className="font-display text-2xl font-bold" data-testid="public-reports-title">
        Quality report
      </h1>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            data-testid={t.testid}
            className="rounded-xl border border-hairline bg-surface p-5"
          >
            <p className="text-sm text-content-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-bold">{t.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h2 className="mb-4 font-semibold">Pass rate per run</h2>
        {report.trend.length === 0 ? (
          <p className="text-sm text-content-subtle">No run data yet.</p>
        ) : (
          <div className="flex h-44 items-end gap-2" data-testid="public-report-trend">
            {report.trend.map((t) => {
              const rate = t.passRate ?? 0;
              return (
                // h-full + justify-end: the bar's `height: N%` needs a parent
                // with a definite height to resolve against (same fix as the
                // authenticated report and the dashboard trend widget).
                <div
                  key={t.id}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-xs font-medium text-content">
                    {t.passRate === null ? "—" : `${rate}%`}
                  </span>
                  <div
                    className={`w-full rounded-t ${
                      rate >= 80
                        ? "bg-success"
                        : rate >= 50
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ height: `${Math.max(rate, 3)}%` }}
                    title={`${t.name}: ${t.passRate === null ? "not executed" : `${rate}% (${t.executed} executed)`}`}
                  />
                  <span className="w-full truncate text-center text-[10px] text-content-subtle">
                    {t.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h2 className="mb-1 font-semibold">Flaky tests</h2>
        <p className="mb-3 text-xs text-content-subtle">
          Test cases whose pass/fail outcome flips between runs (≥2 changes).
        </p>
        {report.flaky.length === 0 ? (
          <p className="text-sm text-content-subtle" data-testid="public-report-flaky-empty">
            No flaky tests detected.
          </p>
        ) : !report.namesCases ? (
          // The Test Cases section is off, so this project's case titles stay
          // private — the report publishes the count, not the catalogue.
          <p className="text-sm text-content-muted" data-testid="public-report-flaky-count">
            {report.flaky.length} flaky{" "}
            {report.flaky.length === 1 ? "test case" : "test cases"} detected.
          </p>
        ) : (
          <ul className="space-y-2 text-sm" data-testid="public-report-flaky">
            {report.flaky.map((f) => (
              <li key={f.caseId} className="flex items-center justify-between gap-3">
                <Link
                  href={`/public/${project.slug}/cases/${f.caseId}`}
                  className="min-w-0 truncate text-content hover:text-accent-soft-fg"
                >
                  <span className="font-mono text-xs text-content-subtle">
                    {f.testCase && caseDisplayId(project.slug, f.testCase.seq)}
                  </span>{" "}
                  {f.testCase?.title}
                </Link>
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-fg">
                  {f.flips} flip / {f.total} run
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
