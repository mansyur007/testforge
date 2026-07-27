import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  publicMetadata,
  requirePublicProject,
  type PublicProject,
} from "@/lib/public-share";

// F-38: public project overview. No session, no server actions, no links into
// the authenticated app (the footer CTA in the layout is the only one).
// Cacheable — nothing here is per-viewer.
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

export default async function PublicOverviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await requirePublicProject(params.slug);
  const stats = await loadStats(project);

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
      label: "Browse the test cases →",
      testid: "public-browse-cases",
    },
    {
      on: project.share.showRuns,
      href: `/public/${project.slug}/runs`,
      label: "See the run history →",
      testid: "public-browse-runs",
    },
    {
      on: project.share.showReports,
      href: `/public/${project.slug}/reports`,
      label: "Open the quality report →",
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
        {stats.badgeToken && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/badge/${stats.badgeToken}.svg`}
            alt="Quality badge"
            data-testid="public-quality-badge"
            className="mt-4 h-5"
          />
        )}
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
            {stats.lastUpdated
              ? stats.lastUpdated.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </section>

      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          data-testid={s.testid}
          className="block rounded-xl border border-hairline bg-surface p-5 text-sm text-content hover:border-accent-ring hover:text-accent-soft-fg"
        >
          {s.label}
        </Link>
      ))}
    </>
  );
}
