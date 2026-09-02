import "server-only";
import { db } from "@/lib/db";
import { ensureBuiltInTemplates } from "./sync";
import {
  coverageBreakdown,
  readStoredContent,
  type Coverage,
  type TemplateContent,
} from "./schema";

// F-47: read side of the template library. Every user-facing entry point goes
// through here, so `published` is filtered in one place rather than in each
// caller — the superadmin console is the only surface that reads drafts, and it
// queries `db.caseTemplate` directly.

export type TemplateCard = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  category: string;
  version: number;
  suiteCount: number;
  caseCount: number;
  coverage: Record<Coverage, number>;
};

export type TemplateDetail = TemplateCard & {
  description: string | null;
  content: TemplateContent;
};

/**
 * Published templates for the gallery.
 *
 * `ensureBuiltInTemplates()` runs first because production ships no seed script
 * (the image runs `prisma db push` and starts), so this is where the built-in
 * packs actually reach a live database. It is cached per process and swallows
 * its own errors — a failed sync degrades to whatever rows already exist.
 */
export async function listTemplates(): Promise<TemplateCard[]> {
  await ensureBuiltInTemplates();
  const rows = await db.caseTemplate.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    summary: r.summary,
    category: r.category,
    version: r.version,
    suiteCount: r.suiteCount,
    caseCount: r.caseCount,
    coverage: coverageBreakdown(readStoredContent(r.contentJson)),
  }));
}

/** One published template with its parsed tree, or null. */
export async function getTemplate(slug: string): Promise<TemplateDetail | null> {
  await ensureBuiltInTemplates();
  const row = await db.caseTemplate.findFirst({
    where: { slug, published: true },
  });
  if (!row) return null;
  const content = readStoredContent(row.contentJson);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    description: row.description,
    category: row.category,
    version: row.version,
    suiteCount: row.suiteCount,
    caseCount: row.caseCount,
    coverage: coverageBreakdown(content),
    content,
  };
}

/** Most recent application of each template in a project, for the "already applied" notice. */
export async function lastAppliedByTemplate(
  projectId: string,
): Promise<Map<string, Date>> {
  const rows = await db.templateApplication.findMany({
    where: { projectId },
    select: { templateId: true, appliedAt: true },
    orderBy: { appliedAt: "desc" },
  });
  const out = new Map<string, Date>();
  for (const r of rows) if (!out.has(r.templateId)) out.set(r.templateId, r.appliedAt);
  return out;
}
