import type { SharedStepGroup } from "@prisma/client";
import { db } from "@/lib/db";
import {
  isSharedRef,
  type InlineStep,
  type TestStep,
} from "@/lib/constants";

// F-04: shared-step expansion. Every consumer of a case's steps (detail page,
// run executor, CSV export, API) renders the EXPANDED form; the raw stepsJson
// keeps the {shared: id} reference so editing a group updates all cases.

export type StepGroupLite = { id: string; title: string; steps: InlineStep[] };

export type ExpandedStep = InlineStep & {
  fromShared?: { id: string; title: string };
};

export function parseGroupSteps(stepsJson: string): InlineStep[] {
  try {
    const arr = JSON.parse(stepsJson || "[]");
    return Array.isArray(arr)
      ? arr.filter((s) => s && typeof s.action === "string")
      : [];
  } catch {
    return [];
  }
}

/** Load a project's groups as a lookup map for expansion. */
export async function loadStepGroups(
  projectId: string
): Promise<Map<string, StepGroupLite>> {
  const groups = await db.sharedStepGroup.findMany({ where: { projectId } });
  return new Map(
    groups.map((g) => [
      g.id,
      { id: g.id, title: g.title, steps: parseGroupSteps(g.stepsJson) },
    ])
  );
}

/**
 * Replace {shared} items with the group's inline steps, tagging their origin.
 * A dangling reference (group deleted out-of-band) renders as a visible
 * placeholder step instead of vanishing silently.
 */
export function expandSteps(
  steps: TestStep[],
  groups: Map<string, StepGroupLite>
): ExpandedStep[] {
  const out: ExpandedStep[] = [];
  for (const step of steps) {
    if (isSharedRef(step)) {
      const group = groups.get(step.shared);
      if (!group) {
        out.push({ action: "⚠ missing shared steps", expected: "" });
        continue;
      }
      for (const s of group.steps)
        out.push({ ...s, fromShared: { id: group.id, title: group.title } });
    } else {
      out.push(step);
    }
  }
  return out;
}

/** Non-deleted cases in the project referencing this group. */
export async function findReferencingCases(
  projectId: string,
  groupId: string
): Promise<{ id: string; seq: number; title: string }[]> {
  return db.testCase.findMany({
    where: {
      projectId,
      deletedAt: null,
      stepsJson: { contains: `"shared":"${groupId}"` },
    },
    select: { id: true, seq: true, title: true },
    orderBy: { seq: "asc" },
  });
}

/** API shape for a shared step group (lives here — Next.js route files may
 * only export HTTP handlers). */
export function serializeSharedGroup(g: SharedStepGroup, usageCount?: number) {
  return {
    id: g.id,
    title: g.title,
    steps: parseGroupSteps(g.stepsJson),
    ...(usageCount !== undefined ? { usageCount } : {}),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}
