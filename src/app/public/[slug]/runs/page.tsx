import type { Metadata } from "next";
import {
  publicMetadata,
  requirePublicProject,
  requireSection,
} from "@/lib/public-share";
import { loadPublicRuns } from "@/lib/public-runs";

// F-38 Part B: public, read-only run history. Presentation only — there is no
// run detail route under /public, so per-result comments, defect links and
// assignees have no page to leak from. Every field shown here comes through
// lib/public-runs.ts.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "runs");
  return publicMetadata(project, {
    title: "Test runs",
    description: `Test execution history for ${project.name}, published with TestForge.`,
  });
}

export default async function PublicRunsPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await requirePublicProject(params.slug);
  requireSection(project, "runs");

  const { runs, barKeys, colorOf, labelOf } = await loadPublicRuns(project.id);

  return (
    <>
      <h1 className="font-display text-2xl font-bold" data-testid="public-runs-title">
        Test runs
      </h1>

      <div className="space-y-3" data-testid="public-runs-list">
        {runs.map((run) => (
          <div
            key={run.id}
            data-testid={`public-run-${run.id}`}
            className="rounded-xl border border-hairline bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-content-strong">
                  {run.name}
                  {run.source !== "MANUAL" && (
                    <span className="ml-2 rounded bg-info-soft px-1.5 py-0.5 text-xs text-info-soft-fg">
                      {run.source}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-content-subtle">
                  {run.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    run.status === "COMPLETED"
                      ? "bg-success-soft text-success-soft-fg"
                      : "bg-info-soft text-info-soft-fg"
                  }`}
                >
                  {run.status === "COMPLETED" ? "Completed" : "Active"}
                </span>
                <p className="mt-1 text-xs text-content-subtle">
                  {run.executed}/{run.total} executed
                  {run.passRate !== null && <> · {run.passRate}% pass</>}
                </p>
              </div>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
              {barKeys.map((key) => {
                const count = run.counts[key];
                if (!count) return null;
                return (
                  <div
                    key={key}
                    style={{
                      backgroundColor: colorOf(key),
                      width: `${(count / (run.total || 1)) * 100}%`,
                    }}
                    title={`${labelOf(key)}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {runs.length === 0 && (
          <p
            className="rounded-xl border border-dashed border-hairline-strong p-10 text-center text-sm text-content-subtle"
            data-testid="public-runs-empty"
          >
            No test runs yet.
          </p>
        )}
      </div>
    </>
  );
}
