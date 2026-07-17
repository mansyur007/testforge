import type {
  Attachment,
  CaseDependency,
  Defect,
  DefectLink,
  Session,
  SessionNote,
  SuiteBaseline,
  BaselineEntry,
  TestCase,
  TestRun,
  TestRunResult,
} from "@prisma/client";
import { defectDisplayId } from "@/lib/defects";
import { NextResponse, type NextRequest } from "next/server";
import { getSession, verifyApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";
import { rateLimit, type RateResult } from "@/lib/rate-limit";
import { expandSteps, type StepGroupLite } from "@/lib/steps";
import { parseDatasets } from "@/lib/datasets";
import { can, type Permission } from "@/lib/permissions";

// ---------------------------------------------------------------------------
// Uniform error envelope: every v1 error is { error: { code, message, details? } }
// so clients can branch on a stable machine code, not prose.
// ---------------------------------------------------------------------------
export type FieldError = { field: string; message: string };

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: FieldError[]
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export const unauthorized = () =>
  apiError(401, "unauthorized", "Authentication required");
export const forbidden = (message = "Forbidden") =>
  apiError(403, "forbidden", message);
export const notFoundError = (message = "Not found") =>
  apiError(404, "not_found", message);
export const badRequest = (message: string) =>
  apiError(400, "bad_request", message);
// 422 for well-formed JSON that fails field validation (hand-rolled, no deps).
export const validationError = (details: FieldError[]) =>
  apiError(422, "validation_error", "Validation failed", details);

function tooManyRequests(r: RateResult) {
  return NextResponse.json(
    { error: { code: "rate_limited", message: "Too many requests" } },
    {
      status: 429,
      headers: {
        "Retry-After": String(r.retryAfter),
        "X-RateLimit-Limit": String(r.limit),
        "X-RateLimit-Remaining": String(r.remaining),
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

// One-stop entry guard for v1 handlers. Order of checks:
//   1. Browser session → allowed (page-level RBAC governs writes elsewhere).
//   2. Bearer API key → rate-limited, verified, and — when opts.write is set —
//      required to carry the WRITE scope, else 403.
// Returns the acting userId, or a ready-to-return error Response.
export async function guard(
  req: NextRequest,
  opts: { write?: boolean } = {}
): Promise<{ userId: string } | NextResponse> {
  const session = await getSession();
  if (session) return { userId: session.userId };

  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return unauthorized();
  const token = header.slice(7);

  const r = rateLimit(token);
  if (!r.ok) return tooManyRequests(r);

  const key = await verifyApiKey(token);
  if (!key) return unauthorized();
  if (opts.write && key.scope !== "WRITE")
    return forbidden("This API key is read-only");

  return { userId: key.userId };
}

// F-14: per-project permission check for v1 write routes, applied after the
// route resolves its project (API keys act as their owning user, so the same
// role/permission model governs both the UI and the API). Returns a 403
// response to bubble up, or null when allowed.
export async function requirePerm(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<NextResponse | null> {
  if (await can(userId, projectId, permission)) return null;
  return forbidden(`Your role lacks the ${permission} permission`);
}

// ---------------------------------------------------------------------------
// Serializers — single source of truth for each resource's API shape.
// ---------------------------------------------------------------------------
function safeParse(json: string | null): Record<string, string> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// F-04: pass the project's step groups to include `stepsExpanded` (shared
// references resolved). Callers without groups get raw steps only.
export function serializeCase(
  slug: string,
  c: TestCase,
  stepGroups?: Map<string, StepGroupLite>
) {
  const steps = JSON.parse(c.stepsJson || "[]");
  return {
    id: c.id,
    displayId: caseDisplayId(slug, c.seq),
    seq: c.seq,
    order: c.order,
    title: c.title,
    description: c.description,
    preconditions: c.preconditions,
    steps,
    ...(stepGroups ? { stepsExpanded: expandSteps(steps, stepGroups) } : {}),
    expectedResult: c.expectedResult,
    priority: c.priority,
    type: c.type,
    status: c.status,
    automationStatus: c.automationStatus,
    suiteId: c.suiteId,
    tags: c.tags,
    assigneeId: c.assigneeId,
    linkedIssues: c.linkedIssues,
    custom: JSON.parse(c.customJson || "{}"),
    datasets: parseDatasets(c.datasetJson), // F-13
    estimateSeconds: c.estimateSeconds, // F-23
    // F-15: review workflow state.
    reviewerId: c.reviewerId,
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
    reviewNote: c.reviewNote,
    rev: c.rev,
    muted: c.mutedAt != null, // F-21
    mutedReason: c.mutedReason,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function serializeRun(
  r: TestRun,
  stats?: Record<string, number>
) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    status: r.status,
    source: r.source,
    origin: r.origin,
    milestoneId: r.milestoneId,
    // F-06: parent plan + config combo ({"Browser":"Chrome"}), null when standalone.
    planId: r.planId,
    config: safeParse(r.configJson),
    environmentId: r.environmentId, // F-19
    createdById: r.createdById,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    ...(stats ? { stats } : {}),
  };
}

export function serializeAttachment(a: Attachment) {
  return {
    id: a.id,
    filename: a.filename,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    entityType: a.entityType,
    entityId: a.entityId,
    uploaderId: a.uploaderId,
    url: `/api/attachments/${a.id}`,
    createdAt: a.createdAt.toISOString(),
  };
}

// F-26: built-in defects & their links to cases/results.
export function serializeDefect(slug: string, d: Defect) {
  return {
    id: d.id,
    displayId: defectDisplayId(slug, d.seq),
    seq: d.seq,
    title: d.title,
    severity: d.severity,
    status: d.status,
    bodyMd: d.bodyMd,
    assigneeId: d.assigneeId,
    createdById: d.createdById,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function serializeDefectLink(l: DefectLink) {
  return {
    id: l.id,
    defectId: l.defectId,
    entityType: l.entityType,
    entityId: l.entityId,
    createdAt: l.createdAt.toISOString(),
  };
}

// F-28: suite baselines — named snapshots of a suite tree + case revisions.
export function serializeBaseline(b: SuiteBaseline, entryCount?: number) {
  return {
    id: b.id,
    name: b.name,
    suiteId: b.suiteId,
    createdById: b.createdById,
    createdAt: b.createdAt.toISOString(),
    ...(entryCount !== undefined ? { entryCount } : {}),
  };
}

export function serializeBaselineEntry(e: BaselineEntry) {
  return {
    id: e.id,
    caseId: e.caseId,
    caseRev: e.caseRev,
    suitePath: e.suitePath,
  };
}

// F-32: case dependencies — `case` requires `dependsOn` to pass first.
export function serializeCaseDependency(d: CaseDependency) {
  return {
    id: d.id,
    caseId: d.caseId,
    dependsOnCaseId: d.dependsOnCaseId,
    createdAt: d.createdAt.toISOString(),
  };
}

// F-25: exploratory testing sessions & their timestamped notes.
export function serializeSession(s: Session) {
  return {
    id: s.id,
    charter: s.charter,
    timeboxMinutes: s.timeboxMinutes,
    status: s.status,
    testerId: s.testerId,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
  };
}

export function serializeSessionNote(n: SessionNote) {
  return {
    id: n.id,
    sessionId: n.sessionId,
    kind: n.kind,
    bodyMd: n.bodyMd,
    convertedType: n.convertedType,
    convertedId: n.convertedId,
    createdAt: n.createdAt.toISOString(),
  };
}

// F-21: `muted` mirrors the case's quarantine state — the result keeps its
// real `status` (e.g. FAILED), callers just know to exclude it from pass-rate math.
export function serializeResult(r: TestRunResult, muted = false) {
  return {
    id: r.id,
    caseId: r.caseId,
    status: r.status,
    comment: r.comment,
    elapsedSeconds: r.elapsedSeconds,
    defectUrl: r.defectUrl,
    assigneeId: r.assigneeId,
    custom: JSON.parse(r.customJson || "{}"),
    caseRev: r.caseRev,
    datasetName: r.datasetName, // F-13
    muted, // F-21
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
