import type { Defect, DefectLink } from "@prisma/client";
import { db } from "@/lib/db";

// F-26: built-in defect tracker (complements, not replaces, F-07 external
// trackers) for teams that don't have Jira/GitHub/GitLab connected.

export const DEFECT_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];

export const DEFECT_STATUSES = [
  "OPEN",
  "CONFIRMED",
  "FIXED",
  "WONT_FIX",
  "CLOSED",
] as const;
export type DefectStatus = (typeof DEFECT_STATUSES)[number];

export const DEFECT_SEVERITY_BADGES: Record<DefectSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-gray-100 text-gray-600",
};

export const DEFECT_STATUS_BADGES: Record<DefectStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  FIXED: "bg-green-100 text-green-800",
  WONT_FIX: "bg-slate-100 text-slate-500",
  CLOSED: "bg-gray-100 text-gray-500 line-through",
};

export const DEFECT_LINK_ENTITY_TYPES = ["CASE", "RESULT"] as const;
export type DefectLinkEntityType = (typeof DEFECT_LINK_ENTITY_TYPES)[number];

/** Format ID display: DF-[SLUG]-[NUMBER], mirrors caseDisplayId (F-01). */
export function defectDisplayId(projectSlug: string, seq: number): string {
  return `DF-${projectSlug.toUpperCase()}-${String(seq).padStart(3, "0")}`;
}

/** Links attached to a set of entities, grouped by entityId (mirrors
 * loadIssueLinks in lib/issues.ts). */
export async function loadDefectLinks(
  entityType: DefectLinkEntityType,
  entityIds: string[]
): Promise<Map<string, (DefectLink & { defect: Defect })[]>> {
  if (!entityIds.length) return new Map();
  const links = await db.defectLink.findMany({
    where: { entityType, entityId: { in: entityIds } },
    include: { defect: true },
    orderBy: { createdAt: "asc" },
  });
  const byEntity = new Map<string, (DefectLink & { defect: Defect })[]>();
  for (const l of links) {
    const list = byEntity.get(l.entityId) ?? [];
    list.push(l);
    byEntity.set(l.entityId, list);
  }
  return byEntity;
}
