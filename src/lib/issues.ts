import type { IssueLink } from "@prisma/client";
import { db } from "@/lib/db";
import { caseDisplayId, type TestStep } from "@/lib/constants";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { notifyBaseUrl } from "@/lib/notifications";

// F-07: shared helpers for issue links. The provider clients live in
// lib/issue-providers.ts; this module owns the TestForge-side shaping —
// what an issue created from a failure says, and the JSON shape of a link.

export type IssueEntityType = "CASE" | "RESULT";

/** API shape for an issue link. Note what is absent: nothing here can expose
 * `Integration.authEnc`, which never leaves the server. */
export function serializeIssueLink(l: IssueLink) {
  return {
    id: l.id,
    provider: l.provider,
    issueKey: l.issueKey,
    issueUrl: l.issueUrl,
    title: l.title,
    status: l.status,
    entityType: l.entityType,
    entityId: l.entityId,
    syncedAt: l.syncedAt ? l.syncedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  };
}

export type IssueDraft = { title: string; body: string };

/**
 * Build the issue a failed result should file: a title a triager can scan, and
 * a body that reproduces the failure without opening TestForge — steps expanded
 * (F-04 shared refs resolved), expected vs actual, and a backlink.
 */
export async function draftIssueFromResult(resultId: string): Promise<IssueDraft | null> {
  const result = await db.testRunResult.findUnique({
    where: { id: resultId },
    include: { run: { include: { project: true } }, testCase: true },
  });
  if (!result) return null;

  const { testCase, run } = result;
  const slug = run.project.slug;
  const displayId = caseDisplayId(slug, testCase.seq);
  const steps = expandSteps(
    JSON.parse(testCase.stepsJson || "[]") as TestStep[],
    await loadStepGroups(run.projectId)
  );

  const lines: string[] = [];
  lines.push(`Reported from TestForge — test run **${run.name}**.`);
  lines.push("");

  if (testCase.preconditions) {
    lines.push("## Preconditions");
    lines.push(testCase.preconditions);
    lines.push("");
  }

  lines.push("## Steps to reproduce");
  if (steps.length === 0) {
    lines.push("_No steps recorded on this test case._");
  } else {
    steps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.action}${s.expected ? ` — _expected:_ ${s.expected}` : ""}`);
    });
  }
  lines.push("");

  lines.push("## Expected result");
  lines.push(testCase.expectedResult?.trim() || "_Not specified on the test case._");
  lines.push("");

  lines.push("## Actual result");
  lines.push(result.comment?.trim() || "_Marked FAILED without execution notes._");
  lines.push("");

  const env = [
    run.origin ? `Origin: ${run.origin}` : null,
    `Source: ${run.source}`,
    result.caseRev != null ? `Case revision: ${result.caseRev}` : null,
  ].filter(Boolean);
  if (env.length) {
    lines.push("## Environment");
    env.forEach((e) => lines.push(`- ${e}`));
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `TestForge: [${displayId}](${notifyBaseUrl()}/projects/${slug}/cases/${testCase.id}) · [run](${notifyBaseUrl()}/projects/${slug}/runs/${run.id})`
  );

  return {
    title: `[${displayId}] ${testCase.title} failed in ${run.name}`,
    body: lines.join("\n"),
  };
}

/** Links attached to a set of entities, grouped by entityId. */
export async function loadIssueLinks(
  entityType: IssueEntityType,
  entityIds: string[]
): Promise<Map<string, IssueLink[]>> {
  if (!entityIds.length) return new Map();
  const links = await db.issueLink.findMany({
    where: { entityType, entityId: { in: entityIds } },
    orderBy: { createdAt: "asc" },
  });
  const byEntity = new Map<string, IssueLink[]>();
  for (const l of links) {
    const list = byEntity.get(l.entityId) ?? [];
    list.push(l);
    byEntity.set(l.entityId, list);
  }
  return byEntity;
}
