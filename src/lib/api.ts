import type { Attachment, TestCase, TestRun, TestRunResult } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getSession, verifyApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";
import { rateLimit, type RateResult } from "@/lib/rate-limit";

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

// ---------------------------------------------------------------------------
// Serializers — single source of truth for each resource's API shape.
// ---------------------------------------------------------------------------
export function serializeCase(slug: string, c: TestCase) {
  return {
    id: c.id,
    displayId: caseDisplayId(slug, c.seq),
    seq: c.seq,
    title: c.title,
    description: c.description,
    preconditions: c.preconditions,
    steps: JSON.parse(c.stepsJson || "[]"),
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

export function serializeResult(r: TestRunResult) {
  return {
    id: r.id,
    caseId: r.caseId,
    status: r.status,
    comment: r.comment,
    elapsedSeconds: r.elapsedSeconds,
    defectUrl: r.defectUrl,
    assigneeId: r.assigneeId,
    custom: JSON.parse(r.customJson || "{}"),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
