import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { NOINDEX } from "@/lib/seo";

// F-38: the single security choke point for /public/<slug>. Every public page
// loads its project through loadPublicProject() and nothing else — there is no
// session, no permission check and no mutation anywhere behind these routes, so
// "is this project shared right now" has to be answered in exactly one place.
//
// A disabled (or never-created) share is indistinguishable from a project that
// never existed: both notFound(). Section toggles work the same way — a section
// that is off is a 404, not a "you don't have access" hint.

export type PublicProject = NonNullable<
  Awaited<ReturnType<typeof loadPublicProject>>
>;

export async function loadPublicProject(slug: string) {
  const project = await db.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      publicShare: {
        select: {
          enabled: true,
          showCases: true,
          showRuns: true,
          showReports: true,
          indexable: true,
        },
      },
    },
  });
  if (!project || !project.publicShare?.enabled) return null;
  return { ...project, share: project.publicShare };
}

/** Load a shared project or 404 — the entry line of every public page. */
export async function requirePublicProject(slug: string) {
  const project = await loadPublicProject(slug);
  if (!project) notFound();
  return project;
}

export type PublicSection = "cases" | "runs" | "reports";

const SECTION_FLAG: Record<PublicSection, keyof PublicProject["share"]> = {
  cases: "showCases",
  runs: "showRuns",
  reports: "showReports",
};

/** 404 unless the owner turned this section on. */
export function requireSection(
  project: PublicProject,
  section: PublicSection
): void {
  if (!project.share[SECTION_FLAG[section]]) notFound();
}

/**
 * Shared metadata for the public pages. Indexing is opt-in per project
 * (`indexable`), so the default for every public page is noindex/nofollow.
 */
export function publicMetadata(
  project: PublicProject,
  opts: { title?: string; description?: string; path?: string } = {}
): Metadata {
  const title = opts.title
    ? `${opts.title} — ${project.name} — TestForge`
    : `${project.name} — TestForge`;
  const description =
    opts.description ||
    project.description ||
    `Test cases and QA documentation for ${project.name}, published with TestForge.`;
  const index = project.share.indexable;
  // F-40: a section's own path, so /cases and /runs each declare themselves
  // canonical instead of all four sections collapsing onto the overview.
  const url = `/public/${project.slug}${opts.path ?? ""}`;
  return {
    title,
    description,
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : NOINDEX,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url,
      title,
      description,
    },
  };
}

/** Absolute origin for links shown to the owner (copy URL, preview). */
export function publicBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export function publicShareUrl(slug: string): string {
  return `${publicBaseUrl()}/public/${slug}`;
}
