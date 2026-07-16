import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  serializeCase,
  requirePerm,
} from "@/lib/api";
import { PRIORITIES, CASE_TYPES, caseDisplayId } from "@/lib/constants";
import { dispatchWebhook } from "@/lib/webhooks";
import { recordRevision } from "@/lib/case-revisions";

// L-03: batch upsert for `testforge cases push` (GitOps sync). Every design
// choice serves conflict safety: an item whose baseRev no longer matches the
// server's rev returns { status: "conflict" } WITHOUT writing, and a payload
// identical to current state returns "unchanged" without touching the row —
// no revision spam from repeated pushes. Item-level atomicity: one conflict
// doesn't block the clean items in the same batch (CI-friendly).

const MAX_ITEMS = 500;

type SyncFields = {
  title?: unknown;
  suite?: unknown; // "Auth/Login" path, "" = no suite
  priority?: unknown;
  type?: unknown;
  tags?: unknown; // string[]
  preconditions?: unknown;
  steps?: unknown; // [{action, expected?}]
  expected?: unknown;
};

type SyncItem = { displayId?: unknown; baseRev?: unknown; fields?: SyncFields };

function normalizeSteps(raw: unknown): { action: string; expected: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const steps: { action: string; expected: string }[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") return null;
    const step = s as { action?: unknown; expected?: unknown };
    steps.push({
      action: String(step.action ?? ""),
      expected: String(step.expected ?? ""),
    });
  }
  return steps;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true, slug: true },
  });
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "case.write"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray(body.upserts))
    return validationError([
      { field: "upserts", message: "must be an array of sync items" },
    ]);
  if (body.upserts.length > MAX_ITEMS)
    return validationError([
      { field: "upserts", message: `max ${MAX_ITEMS} items per call` },
    ]);

  // Suite paths are resolved/created sequentially with a per-request cache so
  // sibling items never race duplicate suites — same discipline as the F-22
  // import committer.
  const suiteCache = new Map<string, string | null>([["", null]]);
  async function resolveSuitePath(path: string[]): Promise<string | null> {
    const key = path.join(" > ");
    const cached = suiteCache.get(key);
    if (cached !== undefined) return cached;
    const parentId = await resolveSuitePath(path.slice(0, -1));
    const name = path[path.length - 1];
    let suite = await db.testSuite.findFirst({
      where: { projectId: project!.id, parentId, name },
      select: { id: true },
    });
    if (!suite) {
      const last = await db.testSuite.findFirst({
        where: { projectId: project!.id, parentId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      suite = await db.testSuite.create({
        data: {
          projectId: project!.id,
          parentId,
          name,
          order: (last?.order ?? -1) + 1,
        },
        select: { id: true },
      });
    }
    suiteCache.set(key, suite.id);
    return suite.id;
  }

  const idPattern = new RegExp(`^TC-${project.slug.toUpperCase()}-(\\d+)$`, "i");
  const results: {
    displayId: string;
    id: string | null;
    rev: number | null;
    status: "created" | "updated" | "conflict" | "unchanged" | "invalid";
    error?: string;
  }[] = [];

  for (const raw of body.upserts as SyncItem[]) {
    const fields = (raw?.fields ?? {}) as SyncFields;
    const displayId = raw?.displayId ? String(raw.displayId) : null;

    const invalid = (error: string) =>
      results.push({
        displayId: displayId ?? String(fields.title ?? "?"),
        id: null,
        rev: null,
        status: "invalid",
        error,
      });

    // Normalize the YAML-shaped fields into column values.
    const title = fields.title != null ? String(fields.title).trim() : undefined;
    if (title !== undefined && !title) {
      invalid("title cannot be empty");
      continue;
    }
    const priority =
      fields.priority != null ? String(fields.priority).toUpperCase() : undefined;
    if (priority !== undefined && !PRIORITIES.includes(priority as never)) {
      invalid(`priority must be one of: ${PRIORITIES.join(", ")}`);
      continue;
    }
    const type = fields.type != null ? String(fields.type).toUpperCase() : undefined;
    if (type !== undefined && !CASE_TYPES.includes(type as never)) {
      invalid(`type must be one of: ${CASE_TYPES.join(", ")}`);
      continue;
    }
    const tags =
      fields.tags !== undefined
        ? Array.isArray(fields.tags)
          ? fields.tags.map((t) => String(t).trim()).filter(Boolean).join(",")
          : null
        : undefined;
    if (tags === null) {
      invalid("tags must be an array of strings");
      continue;
    }
    const steps =
      fields.steps !== undefined ? normalizeSteps(fields.steps) : undefined;
    if (steps === null) {
      invalid("steps must be an array of {action, expected}");
      continue;
    }
    const preconditions =
      fields.preconditions !== undefined
        ? String(fields.preconditions ?? "") || null
        : undefined;
    const expectedResult =
      fields.expected !== undefined
        ? String(fields.expected ?? "") || null
        : undefined;
    const suiteId =
      fields.suite !== undefined
        ? await resolveSuitePath(
            String(fields.suite ?? "")
              .split("/")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        : undefined;

    if (!displayId) {
      // Create. Title is the only hard requirement.
      if (!title) {
        invalid("title is required for new cases");
        continue;
      }
      const counter = await db.project.update({
        where: { id: project.id },
        data: { caseCounter: { increment: 1 } },
        select: { caseCounter: true },
      });
      const created = await db.testCase.create({
        data: {
          projectId: project.id,
          suiteId: suiteId ?? null,
          seq: counter.caseCounter,
          title,
          preconditions: preconditions ?? null,
          stepsJson: JSON.stringify(steps ?? []),
          expectedResult: expectedResult ?? null,
          priority: priority ?? "MEDIUM",
          type: type ?? "FUNCTIONAL",
          tags: tags ?? "",
        },
      });
      await recordRevision(created.id, g.userId); // F-05: rev 1 "created"
      await logAudit({
        userId: g.userId,
        action: "case.sync",
        entityType: "case",
        entityId: created.id,
        detail: "created via cases push",
      });
      await dispatchWebhook(
        project.id,
        "case.created",
        serializeCase(project.slug, created)
      );
      results.push({
        displayId: caseDisplayId(project.slug, created.seq),
        id: created.id,
        rev: created.rev,
        status: "created",
      });
      continue;
    }

    // Update path — keyed by display id, guarded by baseRev.
    const m = idPattern.exec(displayId);
    const existing = m
      ? await db.testCase.findFirst({
          where: {
            projectId: project.id,
            seq: parseInt(m[1], 10),
            deletedAt: null,
          },
        })
      : null;
    if (!existing) {
      // Deleted (or never existed) on the server — the CLI reports this and
      // never auto-deletes local files; surfacing it as a conflict keeps the
      // failure mode "exit 1 with a report".
      results.push({
        displayId,
        id: null,
        rev: null,
        status: "conflict",
        error: "case not found on server",
      });
      continue;
    }
    const baseRev = Number(raw?.baseRev);
    if (!Number.isInteger(baseRev) || baseRev !== existing.rev) {
      results.push({
        displayId,
        id: existing.id,
        rev: existing.rev,
        status: "conflict",
      });
      continue;
    }

    const same =
      (title === undefined || title === existing.title) &&
      (priority === undefined || priority === existing.priority) &&
      (type === undefined || type === existing.type) &&
      (tags === undefined || tags === existing.tags) &&
      (preconditions === undefined ||
        preconditions === (existing.preconditions ?? null)) &&
      (expectedResult === undefined ||
        expectedResult === (existing.expectedResult ?? null)) &&
      (suiteId === undefined || suiteId === existing.suiteId) &&
      (steps === undefined ||
        JSON.stringify(steps) === JSON.stringify(JSON.parse(existing.stepsJson || "[]")));
    if (same) {
      results.push({
        displayId,
        id: existing.id,
        rev: existing.rev,
        status: "unchanged",
      });
      continue;
    }

    let updated = await db.testCase.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(preconditions !== undefined ? { preconditions } : {}),
        ...(expectedResult !== undefined ? { expectedResult } : {}),
        ...(suiteId !== undefined ? { suiteId } : {}),
        ...(steps !== undefined ? { stepsJson: JSON.stringify(steps) } : {}),
      },
    });
    await recordRevision(updated.id, g.userId); // F-05
    updated = await db.testCase.findUniqueOrThrow({ where: { id: updated.id } });
    await logAudit({
      userId: g.userId,
      action: "case.sync",
      entityType: "case",
      entityId: updated.id,
      detail: "updated via cases push",
    });
    await dispatchWebhook(
      project.id,
      "case.updated",
      serializeCase(project.slug, updated)
    );
    results.push({
      displayId,
      id: updated.id,
      rev: updated.rev,
      status: "updated",
    });
  }

  return NextResponse.json({ data: results });
}
