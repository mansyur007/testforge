import "server-only";
import { db } from "@/lib/db";
import { recordRevision } from "@/lib/case-revisions";
import {
  countPruned,
  coverageTag,
  pruneToSelection,
  substituteVariables,
  type PrunedSuite,
  type TemplateContent,
  type TemplateSelection,
} from "./schema";

// F-47: the apply engine — turn a template into real suites and cases inside a
// project. A generalisation of `seedSandbox()` (src/lib/academy/sandbox.ts):
// arbitrary nesting, an existing non-empty project, a partial selection, and a
// caller-chosen target parent.
//
// It deliberately does NOT inherit that function's counter handling.
// `seedSandbox` finishes with `data: { caseCounter: seq }` — an absolute write,
// which is correct there because both its callers guarantee an empty project
// (`ensureSandbox` has just created one, `resetSandbox` sets the counter to 0
// first). Applying to a project that already holds cases has no such guarantee,
// so the range is reserved atomically instead — see `reserveSeqRange` below.
//
// The two are NOT worth collapsing into one implementation, despite the shape
// they share: this engine requires a coverage tag per case, and forcing the
// Academy's three reference cases through it would stamp `coverage:*` tags onto
// the lesson content a learner is graded against, to fix nothing.

export type ApplyResult = {
  suiteIds: string[];
  caseIds: string[];
  rootSuiteId: string | null;
  suiteCount: number;
  caseCount: number;
};

// Pruning, counting and select-all live in `content-core.mjs` — they are pure
// tree work with no database in them, and keeping them there is what lets
// `scripts/templates-selftest.mjs` exercise the orphan rule under bare node.
export { pruneToSelection, selectAll } from "./schema";
export type { TemplateSelection } from "./schema";

/**
 * Reserve `n` consecutive case numbers for this project.
 *
 * `increment` returns the POST-update value, so the reserved block is
 * `[caseCounter - n + 1 … caseCounter]` and it is ours before a single case row
 * exists. Two applies running at once get disjoint blocks; an absolute write
 * would hand both the same numbers.
 */
async function reserveSeqRange(
  tx: Pick<typeof db, "project">,
  projectId: string,
  n: number,
): Promise<number> {
  const project = await tx.project.update({
    where: { id: projectId },
    data: { caseCounter: { increment: n } },
    select: { caseCounter: true },
  });
  return project.caseCounter - n + 1;
}

/**
 * Apply a template into a project.
 *
 * `targetSuiteId` must already have been checked to belong to `projectId` — the
 * caller owns the tenant guard, because it also owns the refusal shape (a
 * foreign id is a 404, not a 403).
 *
 * Suite name collisions with existing content create a second suite rather than
 * merging: silently folding thirty cases into a suite the user did not choose is
 * the more surprising outcome. The preview screen warns instead.
 */
export async function applyTemplate(params: {
  projectId: string;
  content: TemplateContent;
  targetSuiteId: string | null;
  selection: TemplateSelection;
  variables: Record<string, string>;
  status: string;
  userId: string;
}): Promise<ApplyResult> {
  const { projectId, content, targetSuiteId, selection, variables, status, userId } =
    params;

  const pruned = pruneToSelection(content.suites, selection);
  const { suites: suiteCount, cases: caseCount } = countPruned(pruned);
  if (suiteCount === 0) {
    return { suiteIds: [], caseIds: [], rootSuiteId: null, suiteCount: 0, caseCount: 0 };
  }

  const sub = (text: string) => substituteVariables(text, variables);

  const result = await db.$transaction(async (tx) => {
    const firstSeq =
      caseCount > 0 ? await reserveSeqRange(tx, projectId, caseCount) : 0;
    let seq = firstSeq;

    // Applied suites land after whatever is already under the target parent,
    // rather than interleaving with it.
    const siblings = await tx.testSuite.findMany({
      where: { projectId, parentId: targetSuiteId },
      select: { order: true },
      orderBy: { order: "desc" },
      take: 1,
    });
    let rootOrder = (siblings[0]?.order ?? -1) + 1;

    const suiteIds: string[] = [];
    const caseIds: string[] = [];

    const createSuites = async (list: PrunedSuite[], parentId: string | null) => {
      for (let i = 0; i < list.length; i++) {
        const node = list[i];
        const suite = await tx.testSuite.create({
          data: {
            projectId,
            parentId,
            name: sub(node.source.name),
            description: sub(node.source.description) || null,
            // Only the top level has existing siblings to sort after; a suite
            // created in this pass is empty, so its children start at 0.
            order: parentId === targetSuiteId ? rootOrder++ : i,
          },
          select: { id: true },
        });
        suiteIds.push(suite.id);

        for (let ci = 0; ci < node.cases.length; ci++) {
          const c = node.cases[ci];
          const tags = [coverageTag(c.coverage), ...c.tags].join(",");
          const created = await tx.testCase.create({
            data: {
              projectId,
              suiteId: suite.id,
              seq: seq++,
              order: ci,
              title: sub(c.title),
              preconditions: sub(c.preconditions) || null,
              expectedResult: sub(c.expectedResult) || null,
              stepsJson: JSON.stringify(
                c.steps.map((s) => ({
                  action: sub(s.action),
                  expected: sub(s.expected),
                })),
              ),
              priority: c.priority,
              type: c.type,
              status,
              tags,
              ...(c.estimateSeconds !== undefined
                ? { estimateSeconds: c.estimateSeconds }
                : {}),
            },
            select: { id: true },
          });
          caseIds.push(created.id);
        }

        await createSuites(node.children, suite.id);
      }
    };

    await createSuites(pruned, targetSuiteId);
    return { suiteIds, caseIds };
  });

  // F-05: rev 1 "created" for each new case. Outside the transaction on
  // purpose — recordRevision opens its own reads and would not see uncommitted
  // rows through the outer client. Same shape as copyCasesToProject, and a
  // failure here costs a history entry, not the cases themselves.
  for (const caseId of result.caseIds) {
    await recordRevision(caseId, userId);
  }

  return {
    ...result,
    rootSuiteId: result.suiteIds[0] ?? null,
    suiteCount,
    caseCount,
  };
}
