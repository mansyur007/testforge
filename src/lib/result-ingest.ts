import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { serializeRun } from "@/lib/api";
import { resolveOrCreateEnvironment } from "@/lib/environments";
import { publishRunEvent } from "@/lib/run-events";
import type { NormalizedResults } from "@/lib/result-parsers";

export type IngestOptions = {
  projectSlug: string;
  userId: string;
  runName: string;
  source: string;
  origin: string | null;
  env?: string | null; // F-19: &env=<name>, auto-creates if the project allows it
};

export type IngestOutcome =
  | {
      ok: true;
      run: Awaited<ReturnType<typeof createRun>>;
      matched: number;
      automated: number;
      unmatched: string[];
      summary: { passed: number; failed: number; skipped: number };
    }
  | { ok: false; status: 404 | 400 | 422; error: string; unmatched?: string[] };

async function createRun(
  projectId: string,
  data: {
    name: string;
    source: string;
    origin: string | null;
    environmentId: string | null;
    createdById: string;
    results: { caseId: string; caseRev: number; status: string; comment: string; elapsedSeconds: number }[];
  }
) {
  return db.testRun.create({
    data: {
      projectId,
      name: data.name,
      source: data.source,
      origin: data.origin,
      environmentId: data.environmentId,
      status: "COMPLETED",
      completedAt: new Date(),
      createdById: data.createdById,
      results: { create: data.results },
    },
    include: { results: true },
  });
}

// Shared by /api/v1/junit and /api/v1/results: match each normalized test
// against a case (TC-<SLUG>-<n> annotation in the name, else exact title),
// then create a completed run from the matches.
export async function ingestResults(
  normalized: NormalizedResults,
  opts: IngestOptions
): Promise<IngestOutcome> {
  const project = await db.project.findFirst({
    where: { slug: opts.projectSlug, members: { some: { userId: opts.userId } } },
    include: { cases: { where: { deletedAt: null } } },
  });
  if (!project)
    return { ok: false, status: 404, error: `Project with slug "${opts.projectSlug}" not found` };

  if (!normalized.tests.length)
    return { ok: false, status: 400, error: "No tests found in the uploaded file" };

  const idPattern = new RegExp(`TC-${project.slug.toUpperCase()}-(\\d+)`, "i");

  const matched: { caseId: string; caseRev: number; status: string; comment: string; time: number }[] = [];
  const unmatched: string[] = [];

  for (const t of normalized.tests) {
    const name = t.name;
    const idMatch = name.match(idPattern);
    let testCase = idMatch
      ? project.cases.find((c) => c.seq === parseInt(idMatch[1], 10))
      : undefined;
    if (!testCase) {
      const cleanName = name.replace(idPattern, "").trim();
      testCase = project.cases.find((c) => c.title.toLowerCase() === cleanName.toLowerCase());
    }

    if (testCase) {
      matched.push({
        caseId: testCase.id,
        caseRev: testCase.rev,
        status: t.status,
        comment: `[${opts.source}] ${name}`,
        time: Math.round(t.timeSeconds ?? 0),
      });
    } else {
      unmatched.push(name);
    }
  }

  if (!matched.length)
    return {
      ok: false,
      status: 422,
      error:
        "No tests matched any test case. Add a TC-ID annotation to the test name, or use an identical title.",
      unmatched,
    };

  // dedupe: one result per case per run (keep the last status seen)
  const byCase = new Map<string, (typeof matched)[number]>();
  matched.forEach((m) => byCase.set(m.caseId, m));

  // F-19: &env=<name> tags the run, auto-creating the environment when the
  // project allows it (Project.autoCreateEnvs).
  const environmentId = await resolveOrCreateEnvironment(project.id, opts.env ?? null);

  const run = await createRun(project.id, {
    name: opts.runName,
    source: opts.source,
    origin: opts.origin,
    environmentId,
    createdById: opts.userId,
    results: Array.from(byCase.values()).map((m) => ({
      caseId: m.caseId,
      caseRev: m.caseRev,
      status: m.status,
      comment: m.comment,
      elapsedSeconds: m.time,
    })),
  });

  // A matched case now has a real automated test either way (pass or fail).
  const automated = await db.testCase.updateMany({
    where: { id: { in: Array.from(byCase.keys()) }, projectId: project.id, automationStatus: { not: "AUTOMATED" } },
    data: { automationStatus: "AUTOMATED" },
  });

  await logAudit({
    userId: opts.userId,
    action: "automation.upload",
    entityType: "run",
    entityId: run.id,
    detail: `${opts.source}: ${byCase.size} matched, ${unmatched.length} unmatched, ${automated.count} → AUTOMATED`,
  });

  const summary = {
    passed: run.results.filter((r) => r.status === "PASSED").length,
    failed: run.results.filter((r) => r.status === "FAILED").length,
    skipped: run.results.filter((r) => r.status === "SKIPPED").length,
  };

  // L-04: publish each ingested result — a freshly created run rarely has a
  // page open on it yet, but a re-upload into a shared run name flow can.
  const writer = await db.user.findUnique({
    where: { id: opts.userId },
    select: { name: true },
  });
  const at = new Date().toISOString();
  for (const r of run.results)
    publishRunEvent(run.id, {
      type: "result",
      resultId: r.id,
      caseId: r.caseId,
      datasetName: r.datasetName,
      status: r.status,
      comment: r.comment,
      elapsedSeconds: r.elapsedSeconds,
      by: { id: opts.userId, name: writer?.name ?? "Automation" },
      at,
    });

  // Born completed, so only run.completed fires (a separate run.created for
  // the same instant would just be noise).
  await dispatchWebhook(project.id, "run.completed", serializeRun(run));
  await notify(project.id, "run.completed", {
    title: `Run completed: ${opts.runName}`,
    url: `${notifyBaseUrl()}/projects/${project.slug}/runs/${run.id}`,
    tone: summary.failed > 0 ? "bad" : "good",
    fields: [
      { label: "Passed", value: String(summary.passed) },
      { label: "Failed", value: String(summary.failed) },
      { label: "Source", value: opts.source },
    ],
  });

  return { ok: true, run, matched: byCase.size, automated: automated.count, unmatched, summary };
}
