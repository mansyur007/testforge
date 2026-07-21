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
  const [caseCount, suiteCount, latestCase, badge] = await Promise.all([
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
  ]);
  return {
    caseCount,
    suiteCount,
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
  ];

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-2xl font-bold" data-testid="public-overview-title">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
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

      <section className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            data-testid={t.testid}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase text-slate-400">
              {t.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{t.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Last updated
          </p>
          <p className="mt-1 text-sm text-slate-600">
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

      {project.share.showCases && (
        <Link
          href={`/public/${project.slug}/cases`}
          data-testid="public-browse-cases"
          className="block rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
        >
          Browse the test cases →
        </Link>
      )}
    </>
  );
}
