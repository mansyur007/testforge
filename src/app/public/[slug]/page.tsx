import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { TFIcon } from "@/components/icons";
import {
  publicMetadata,
  requirePublicProject,
  type PublicProject,
} from "@/lib/public-share";
import {
  loadDesignInsights,
  loadExecutionInsights,
  relativeDays,
  type DesignInsights,
  type ExecutionInsights,
} from "@/lib/public-overview";
import {
  ActivityPanel,
  AutomationPanel,
  DesignPanel,
  LatestRunPanel,
  TagsPanel,
  TrendPanel,
} from "@/components/PublicInsights";

// F-38: public project overview. No session, no server actions, no links into
// the authenticated app (the footer CTA in the layout is the only one).
// Cacheable — nothing here is per-viewer.
//
// F-42: the counters grew into insight panels. Each panel is gated by the same
// section toggle that gates the page it summarizes, so the overview can never
// publish more than the sections the owner turned on:
//   showCases                → Test design / Automation / Coverage tags
//   showRuns || showReports  → Latest run / Pass rate trend / Run activity
// Everything they render is an aggregate from lib/public-overview.ts.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await requirePublicProject(params.slug);
  return publicMetadata(project);
}

async function loadStats(project: PublicProject) {
  const [caseCount, suiteCount, latestCase, badge, runCount] = await Promise.all([
    db.testCase.count({ where: { projectId: project.id, deletedAt: null } }),
    db.testSuite.count({ where: { projectId: project.id } }),
    db.testCase.findFirst({
      where: { projectId: project.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    // L-01: the project's quality badge, if the owner published one — it is
    // already a public, token-authenticated image, so embedding it leaks
    // nothing the badge URL doesn't already expose.
    db.badgeToken.findUnique({
      where: { projectId: project.id },
      select: { token: true, revokedAt: true },
    }),
    // Only a tally, and only rendered when the Runs section is on.
    project.share.showRuns
      ? db.testRun.count({ where: { projectId: project.id } })
      : Promise.resolve(0),
  ]);
  return {
    caseCount,
    suiteCount,
    runCount,
    lastUpdated: latestCase?.updatedAt ?? null,
    badgeToken: badge && !badge.revokedAt ? badge.token : null,
  };
}

const DATE_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
} as const;

export default async function PublicOverviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await requirePublicProject(params.slug);
  // Reports publishes the same execution aggregates as Runs, so either toggle
  // is enough for the execution panels — with both off they never load.
  const showExecution = project.share.showRuns || project.share.showReports;

  const [stats, design, execution] = await Promise.all([
    loadStats(project),
    project.share.showCases
      ? loadDesignInsights(project.id)
      : Promise.resolve<DesignInsights | null>(null),
    showExecution
      ? loadExecutionInsights(project.id)
      : Promise.resolve<ExecutionInsights | null>(null),
  ]);

  // A run is activity too — with the execution sections on, "last updated"
  // would otherwise go stale on a project whose cases are simply finished.
  const lastActivity = [stats.lastUpdated, execution?.latest?.createdAt ?? null]
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const tiles = [
    { label: "Test cases", value: stats.caseCount, testid: "public-stat-cases" },
    { label: "Suites", value: stats.suiteCount, testid: "public-stat-suites" },
    ...(project.share.showRuns
      ? [{ label: "Test runs", value: stats.runCount, testid: "public-stat-runs" }]
      : []),
  ];

  const sections = [
    {
      on: project.share.showCases,
      href: `/public/${project.slug}/cases`,
      icon: "manual",
      label: "Test cases",
      blurb: "Browse the suites, steps and expected results.",
      testid: "public-browse-cases",
    },
    {
      on: project.share.showRuns,
      href: `/public/${project.slug}/runs`,
      icon: "cicd",
      label: "Test runs",
      blurb: "Every execution, with its status breakdown.",
      testid: "public-browse-runs",
    },
    {
      on: project.share.showReports,
      href: `/public/${project.slug}/reports`,
      icon: "trend",
      label: "Quality report",
      blurb: "Pass rate, automation coverage and flaky tests.",
      testid: "public-browse-reports",
    },
  ].filter((s) => s.on);

  return (
    <>
      <section className="rounded-xl border border-hairline bg-surface p-6">
        <h1 className="font-display text-2xl font-bold" data-testid="public-overview-title">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-content">
            {project.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {stats.badgeToken && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/badge/${stats.badgeToken}.svg`}
              alt="Quality badge"
              data-testid="public-quality-badge"
              className="h-5"
            />
          )}
          {lastActivity && (
            <span className="text-xs text-content-subtle">
              Updated {relativeDays(lastActivity)}
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            data-testid={t.testid}
            className="rounded-xl border border-hairline bg-surface p-5"
          >
            <p className="text-xs font-semibold uppercase text-content-subtle">
              {t.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{t.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-hairline bg-surface p-5">
          <p className="text-xs font-semibold uppercase text-content-subtle">
            Last updated
          </p>
          <p className="mt-1 text-sm text-content">
            {lastActivity
              ? lastActivity.toLocaleDateString("en-US", DATE_FORMAT)
              : "—"}
          </p>
        </div>
      </section>

      {execution && execution.latest && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <LatestRunPanel execution={execution} />
            <TrendPanel execution={execution} />
          </div>
          <ActivityPanel execution={execution} />
        </>
      )}

      {design && design.total > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <DesignPanel design={design} />
            <AutomationPanel design={design} />
          </div>
          <TagsPanel design={design} />
        </>
      )}

      {sections.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              data-testid={s.testid}
              className="flex h-full flex-col rounded-xl border border-hairline bg-surface p-5 hover:border-accent-ring"
            >
              <span className="flex items-center gap-2 font-medium text-content-strong">
                <TFIcon name={s.icon} className="h-5 w-5" />
                {s.label}
              </span>
              <span className="mt-1.5 block text-sm text-content-muted">
                {s.blurb}
              </span>
              <span className="mt-auto block pt-3 text-sm font-medium text-accent-text">
                Open →
              </span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
