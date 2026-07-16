import { db } from "@/lib/db";
import { caseDisplayId, parseTags } from "@/lib/constants";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, isMuted, NON_EXECUTED_BUCKETS } from "@/lib/mute";
import { deltaOf } from "@/lib/run-compare";

// L-02: CI quality gates. evaluateGate is the single source of truth for a
// gate verdict — the settings-page preview, the API endpoint, and (through
// it) the CLI all call this. All math is kind-based (F-14) and mute-aware
// (F-21), so a CI verdict can never disagree with the reports page.

export type GatePolicy = {
  minPassRate?: number; // 0..100; check passes when passRate >= value
  maxNewFailures?: number; // >= 0
  blockOnUntested?: boolean; // true → any non-muted UNTESTED/IN_PROGRESS fails
  requiredTags?: string[]; // every non-muted case with ANY of these tags must be PASS-kind
};

const POLICY_KEYS = [
  "minPassRate",
  "maxNewFailures",
  "blockOnUntested",
  "requiredTags",
];

/** Validates a policy object; throws with a field-specific message. */
export function parseGatePolicy(json: string): GatePolicy {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("policy is not valid JSON");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("policy must be a JSON object");
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj))
    if (!POLICY_KEYS.includes(key)) throw new Error(`unknown key "${key}"`);
  const policy: GatePolicy = {};
  if (obj.minPassRate !== undefined) {
    const n = Number(obj.minPassRate);
    if (!Number.isFinite(n) || n < 0 || n > 100)
      throw new Error("minPassRate must be a number between 0 and 100");
    policy.minPassRate = n;
  }
  if (obj.maxNewFailures !== undefined) {
    const n = Number(obj.maxNewFailures);
    if (!Number.isInteger(n) || n < 0)
      throw new Error("maxNewFailures must be an integer >= 0");
    policy.maxNewFailures = n;
  }
  if (obj.blockOnUntested !== undefined) {
    if (typeof obj.blockOnUntested !== "boolean")
      throw new Error("blockOnUntested must be true or false");
    policy.blockOnUntested = obj.blockOnUntested;
  }
  if (obj.requiredTags !== undefined) {
    if (
      !Array.isArray(obj.requiredTags) ||
      obj.requiredTags.some((t) => typeof t !== "string" || !t.trim())
    )
      throw new Error("requiredTags must be an array of non-empty strings");
    policy.requiredTags = (obj.requiredTags as string[]).map((t) => t.trim());
  }
  return policy;
}

export type GateCheck = {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
  note?: string;
};

export type GateVerdict = {
  pass: boolean;
  run: {
    id: string;
    name: string;
    status: string;
    completedAt: string | null;
  };
  checks: GateCheck[];
};

const rowKey = (caseId: string, datasetName: string | null) =>
  `${caseId}::${datasetName ?? ""}`;

export async function evaluateGate(
  projectId: string,
  runId: string,
  policy: GatePolicy
): Promise<GateVerdict | null> {
  const run = await db.testRun.findFirst({
    where: { id: runId, projectId },
    select: {
      id: true,
      name: true,
      status: true,
      completedAt: true,
      createdAt: true,
      source: true,
      results: {
        select: { caseId: true, datasetName: true, status: true },
      },
    },
  });
  if (!run) return null;

  const [defs, project, cases] = await Promise.all([
    loadStatusDefs(projectId),
    db.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { slug: true },
    }),
    db.testCase.findMany({
      where: { id: { in: run.results.map((r) => r.caseId) } },
      select: { id: true, seq: true, mutedAt: true, tags: true },
    }),
  ]);
  const { kindOf } = statusMeta(defs);
  const byCase = new Map(cases.map((c) => [c.id, c]));
  const muted = (caseId: string) => isMuted(byCase.get(caseId)?.mutedAt);
  const displayId = (caseId: string) =>
    caseDisplayId(project.slug, byCase.get(caseId)?.seq ?? 0);
  // F-21: muted cases are excluded from every check, same as the bucket rules.
  const rows = run.results.filter((r) => !muted(r.caseId));

  const checks: GateCheck[] = [];

  if (policy.minPassRate !== undefined) {
    const executed = rows.filter(
      (r) => !NON_EXECUTED_BUCKETS.includes(bucketStatus(r.status, false))
    );
    const passed = executed.filter((r) => kindOf(r.status) === "PASS").length;
    // Zero executed → 0, not divide-by-zero: an empty run must fail loudly.
    const rate = executed.length ? (passed / executed.length) * 100 : 0;
    checks.push({
      name: "minPassRate",
      expected: `>= ${policy.minPassRate}%`,
      actual: `${rate.toFixed(1)}%`,
      pass: rate >= policy.minPassRate,
    });
  }

  if (policy.maxNewFailures !== undefined) {
    // Baseline = most recent COMPLETED run, same project + source, strictly
    // earlier than the gated run. Regression semantics come from deltaOf —
    // the same helper the compare page uses.
    const baseline = await db.testRun.findFirst({
      where: {
        projectId,
        source: run.source,
        status: "COMPLETED",
        createdAt: { lt: run.createdAt },
        id: { not: run.id },
      },
      orderBy: { createdAt: "desc" },
      select: {
        results: { select: { caseId: true, datasetName: true, status: true } },
      },
    });
    if (!baseline) {
      checks.push({
        name: "maxNewFailures",
        expected: `<= ${policy.maxNewFailures}`,
        actual: "0",
        pass: true,
        note: "no previous run",
      });
    } else {
      const base = new Map(
        baseline.results.map((r) => [rowKey(r.caseId, r.datasetName), r.status])
      );
      const regressed = rows.filter(
        (r) =>
          deltaOf(
            base.get(rowKey(r.caseId, r.datasetName)) ?? null,
            r.status,
            kindOf
          ) === "REGRESSION"
      );
      checks.push({
        name: "maxNewFailures",
        expected: `<= ${policy.maxNewFailures}`,
        actual: String(regressed.length),
        pass: regressed.length <= policy.maxNewFailures,
        note: regressed.length
          ? regressed
              .slice(0, 10)
              .map((r) => displayId(r.caseId))
              .join(", ")
          : undefined,
      });
    }
  }

  if (policy.blockOnUntested) {
    const untested = rows.filter((r) =>
      NON_EXECUTED_BUCKETS.includes(bucketStatus(r.status, false))
    );
    checks.push({
      name: "blockOnUntested",
      expected: "0 untested",
      actual: String(untested.length),
      pass: untested.length === 0,
      note: untested.length
        ? untested
            .slice(0, 10)
            .map((r) => displayId(r.caseId))
            .join(", ")
        : undefined,
    });
  }

  for (const tag of policy.requiredTags ?? []) {
    const tagged = rows.filter((r) =>
      parseTags(byCase.get(r.caseId)?.tags ?? "").includes(tag)
    );
    if (!tagged.length) {
      // A typo'd tag must not silently gate green.
      checks.push({
        name: `requiredTag:${tag}`,
        expected: `>=1 case tagged ${tag}`,
        actual: "0 cases",
        pass: false,
      });
      continue;
    }
    const failing = tagged.filter((r) => kindOf(r.status) !== "PASS");
    checks.push({
      name: `requiredTag:${tag}`,
      expected: "all PASS",
      actual: failing.length
        ? `${failing.length} not passing`
        : `${tagged.length} passing`,
      pass: failing.length === 0,
      note: failing.length
        ? failing
            .slice(0, 10)
            .map((r) => displayId(r.caseId))
            .join(", ")
        : undefined,
    });
  }

  return {
    pass: checks.every((c) => c.pass),
    run: {
      id: run.id,
      name: run.name,
      status: run.status,
      completedAt: run.completedAt?.toISOString() ?? null,
    },
    checks,
  };
}
