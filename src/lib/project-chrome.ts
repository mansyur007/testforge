import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";

/**
 * Project header data for a section hub's chrome. Also the membership gate: a
 * non-member (or unknown slug) 404s here before any section renders.
 *
 * Shared by both hubs — settings and tracking — and by the standalone
 * permalink page of every section under them.
 *
 * SERVER ONLY.
 */
export async function loadProjectChrome(slug: string) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();
  return project;
}
