import { db } from "@/lib/db";
import {
  DEFAULT_STATUS_DEFS,
  type StatusDefLite,
} from "@/lib/result-statuses";

// F-14: server-side loaders for result-status defs (the pure helpers live in
// lib/result-statuses.ts so client components can import them without db).

/** The project's status defs — DB rows when the project has customized, else
 * the in-memory defaults. Always ordered; includes inactive rows (callers that
 * render pickers filter on `active`, renderers of stored data don't). */
export async function loadStatusDefs(projectId: string): Promise<StatusDefLite[]> {
  const rows = await db.resultStatusDef.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
  if (rows.length === 0) return DEFAULT_STATUS_DEFS;
  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    color: r.color,
    kind: r.kind,
    order: r.order,
    active: r.active,
    system: r.system,
  }));
}

/** Batch variant for cross-project pages (dashboard): projectId -> defs. */
export async function loadStatusDefsForProjects(
  projectIds: string[]
): Promise<Map<string, StatusDefLite[]>> {
  const rows = projectIds.length
    ? await db.resultStatusDef.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { order: "asc" },
      })
    : [];
  const map = new Map<string, StatusDefLite[]>();
  for (const id of projectIds) map.set(id, DEFAULT_STATUS_DEFS);
  const grouped = new Map<string, StatusDefLite[]>();
  for (const r of rows) {
    const list = grouped.get(r.projectId) ?? [];
    list.push({
      key: r.key,
      label: r.label,
      color: r.color,
      kind: r.kind,
      order: r.order,
      active: r.active,
      system: r.system,
    });
    grouped.set(r.projectId, list);
  }
  grouped.forEach((defs, id) => map.set(id, defs));
  return map;
}
