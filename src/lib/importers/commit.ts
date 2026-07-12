import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { recordRevision } from "@/lib/case-revisions";
import type { ImportedCase } from "./types";

// F-22: shared committer for every tool importer — creates suites by path
// (de-duped, sequential so siblings never race) then cases in chunks of 500
// (one transaction per chunk, one caseCounter reservation per chunk).
const CHUNK_SIZE = 500;

export async function commitImport(
  projectId: string,
  userId: string,
  cases: ImportedCase[]
): Promise<{ imported: number; suitesCreated: number }> {
  if (!cases.length) return { imported: 0, suitesCreated: 0 };

  // 1. Resolve/create every suite path first — sequential lookups so two
  // cases sharing a path never create duplicate sibling suites.
  const suiteCache = new Map<string, string | null>([["", null]]);
  let suitesCreated = 0;
  async function resolveSuitePath(path: string[]): Promise<string | null> {
    const key = path.join(" > ");
    const cached = suiteCache.get(key);
    if (cached !== undefined) return cached;
    const parentId = await resolveSuitePath(path.slice(0, -1));
    const name = path[path.length - 1];
    let suite = await db.testSuite.findFirst({
      where: { projectId, parentId, name },
      select: { id: true },
    });
    if (!suite) {
      const last = await db.testSuite.findFirst({
        where: { projectId, parentId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      suite = await db.testSuite.create({
        data: { projectId, parentId, name, order: (last?.order ?? -1) + 1 },
        select: { id: true },
      });
      suitesCreated++;
    }
    suiteCache.set(key, suite.id);
    return suite.id;
  }
  for (const c of cases) await resolveSuitePath(c.suitePath);

  // 2. Best-effort custom field mapping: a source field's label (case-
  // insensitive) is matched against this project's active CASE defs. No
  // type validation — an import that doesn't fit a def's rules just stores
  // the raw string; there's no column-mapping UI in this feature (F-30).
  const defs = await db.customFieldDef.findMany({
    where: { projectId, entity: "CASE", active: true },
  });
  const defByLabel = new Map(defs.map((d) => [d.label.toLowerCase().trim(), d.key]));
  function buildCustomJson(custom: Record<string, string>): string {
    const out: Record<string, string> = {};
    for (const [label, value] of Object.entries(custom)) {
      const key = defByLabel.get(label.toLowerCase().trim());
      if (key) out[key] = value;
    }
    return JSON.stringify(out);
  }

  // 3. Chunked case creation.
  let imported = 0;
  for (let i = 0; i < cases.length; i += CHUNK_SIZE) {
    const chunk = cases.slice(i, i + CHUNK_SIZE);
    const project = await db.project.update({
      where: { id: projectId },
      data: { caseCounter: { increment: chunk.length } },
      select: { caseCounter: true },
    });
    const startSeq = project.caseCounter - chunk.length + 1;

    const created = await db.$transaction(
      chunk.map((c, idx) =>
        db.testCase.create({
          data: {
            projectId,
            suiteId: suiteCache.get(c.suitePath.join(" > ")) ?? null,
            seq: startSeq + idx,
            title: c.title,
            description: c.description || null,
            preconditions: c.preconditions || null,
            stepsJson: JSON.stringify(c.steps),
            expectedResult: c.expectedResult || null,
            priority: c.priority,
            type: c.type,
            tags: c.tags,
            customJson: buildCustomJson(c.custom),
          },
          select: { id: true },
        })
      )
    );
    for (const c of created) await recordRevision(c.id, userId); // F-05: rev 1 "created"
    imported += chunk.length;
  }

  await logAudit({
    userId,
    action: "case.import_tool",
    entityType: "project",
    entityId: projectId,
    detail: `${imported} cases, ${suitesCreated} suites created`,
  });

  return { imported, suitesCreated };
}
