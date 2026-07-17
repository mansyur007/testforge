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
  gherkin?: string; // F-27: set when the case's stepsJson is a raw Gherkin scenario
};

/** F-27: a Gherkin case's stepsJson is exactly one `{gherkin: "..."}` item —
 * never mixed with inline steps or shared refs. */
export function isGherkinCaseSteps(steps: unknown): steps is [{ gherkin: string }] {
  return (
    Array.isArray(steps) &&
    steps.length === 1 &&
    typeof steps[0] === "object" &&
    steps[0] !== null &&
    typeof (steps[0] as { gherkin?: unknown }).gherkin === "string"
  );
}

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
  // F-27: a Gherkin case has nothing to expand (no shared-step refs are ever
  // mixed in) — surface its raw text as both `action` (safe fallback for
  // consumers that only know inline steps) and `gherkin` (for the ones that
  // render it specially, e.g. GherkinBlock).
  if (isGherkinCaseSteps(steps)) {
    return [{ action: steps[0].gherkin, expected: "", gherkin: steps[0].gherkin }];
  }
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
