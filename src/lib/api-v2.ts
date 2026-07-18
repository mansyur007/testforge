import type {
  ApiKey,
  Attachment,
  Environment,
  Milestone,
  ProjectMember,
  User,
  Webhook,
} from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, verifyApiKey } from "@/lib/auth";
import { rateLimit, type RateResult } from "@/lib/rate-limit";
import { can, type Permission } from "@/lib/permissions";
import { serializeFieldDef } from "@/lib/custom-fields";

// ---------------------------------------------------------------------------
// F-33 — API v2.
//
// v2 is a *superset* of v1's guarantees, not a rewrite of its plumbing. What
// v2 adds over v1:
//
//   1. Project-scoped tokens — an ApiKey may carry a projectId; such a key is
//      rejected (403) on any other project even when its owning user is a
//      member there. Org-wide keys (projectId = null) behave exactly as in v1.
//   2. Per-key rate limits — ApiKey.rateLimitPerMin overrides the global
//      default, and *every* key-authed response carries X-RateLimit-* headers
//      (v1 only sent them on the 429).
//   3. A uniform list envelope with real pagination metadata, so clients can
//      page without guessing.
//
// v1 stays frozen and supported: nothing in this module is imported by the v1
// routes, and v1's `guard()` is untouched.
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
export const validationError = (details: FieldError[]) =>
  apiError(422, "validation_error", "Validation failed", details);
export const conflict = (message: string) =>
  apiError(409, "conflict", message);

// ---------------------------------------------------------------------------
// Rate-limit headers
// ---------------------------------------------------------------------------

function rateHeaders(r: RateResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
  };
}

function tooManyRequests(r: RateResult) {
  return NextResponse.json(
    { error: { code: "rate_limited", message: "Too many requests" } },
    {
      status: 429,
      headers: { ...rateHeaders(r), "Retry-After": String(r.retryAfter) },
    }
  );
}

/**
 * Stamp rate-limit headers onto a handler's response. Session-authed calls
 * carry no budget, so `ctx.rate` is null there and the response passes through
 * untouched.
 */
export function withRate<T extends NextResponse>(res: T, ctx: GuardCtx): T {
  if (!ctx.rate) return res;
  for (const [k, v] of Object.entries(rateHeaders(ctx.rate)))
    res.headers.set(k, v);
  return res;
}

// ---------------------------------------------------------------------------
// Auth & project resolution
// ---------------------------------------------------------------------------

export type GuardCtx = {
  userId: string;
  /** The authenticating key, or null for browser-session calls. */
  key: Pick<ApiKey, "id" | "scope" | "projectId"> | null;
  rate: RateResult | null;
};

/**
 * Entry guard for v2 handlers. Mirrors v1's order (session first, then Bearer
 * key) but consumes the key's *own* rate budget and hands the key back so
 * `resolveProject` can enforce project scoping.
 */
export async function guardV2(
  req: NextRequest,
  opts: { write?: boolean } = {}
): Promise<GuardCtx | NextResponse> {
  const session = await getSession();
  if (session) return { userId: session.userId, key: null, rate: null };

  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return unauthorized();
  const token = header.slice(7);

  // The key must be identified before its budget can be applied, so verify
  // first and rate-limit second. verifyApiKey is a single indexed hash lookup;
  // unknown tokens fall through to the shared bucket below so a firehose of
  // bogus tokens still can't be used to probe for free.
  const key = await verifyApiKey(token);
  if (!key) {
    const r = rateLimit(`anon:${token.slice(0, 16)}`);
    if (!r.ok) return tooManyRequests(r);
    return unauthorized();
  }

  const r = rateLimit(`key:${key.id}`, key.rateLimitPerMin ?? undefined);
  if (!r.ok) return tooManyRequests(r);

  if (opts.write && key.scope !== "WRITE") {
    const res = forbidden("This API key is read-only");
    for (const [k, v] of Object.entries(rateHeaders(r))) res.headers.set(k, v);
    return res;
  }

  return {
    userId: key.userId,
    key: { id: key.id, scope: key.scope, projectId: key.projectId },
    rate: r,
  };
}

/**
 * Resolve a project by slug for the acting principal, enforcing both
 * membership and — for project-scoped keys — the key's own binding.
 *
 * The scope check deliberately returns 403 (not 404): the caller proved it
 * holds a valid key, so telling it "wrong project for this key" is actionable
 * and leaks nothing it couldn't learn from its own key's metadata.
 */
export async function resolveProject(
  ctx: GuardCtx,
  slug: string
): Promise<{ id: string; slug: string; name: string } | NextResponse> {
  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: ctx.userId } } },
    select: { id: true, slug: true, name: true },
  });
  if (!project) return notFoundError("Project not found");

  if (ctx.key?.projectId && ctx.key.projectId !== project.id)
    return forbidden("This API key is scoped to a different project");

  return project;
}

/** Per-project permission check; API keys act as their owning user, as in v1. */
export async function requirePerm(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<NextResponse | null> {
  if (await can(userId, projectId, permission)) return null;
  return forbidden(`Your role lacks the ${permission} permission`);
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const DEFAULT_PER_PAGE = 50;
export const MAX_PER_PAGE = 200;

export type Page = { page: number; perPage: number; skip: number };

/**
 * Read `page`/`perPage` off the query string. Out-of-range and non-numeric
 * values clamp rather than error — a paging param is never worth a 422, and
 * clamping keeps `perPage=100000` from becoming a cheap table scan.
 */
export function readPage(req: NextRequest): Page {
  const sp = req.nextUrl.searchParams;
  const rawPage = Number(sp.get("page") ?? 1);
  const rawPer = Number(sp.get("perPage") ?? DEFAULT_PER_PAGE);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const perPage = Number.isFinite(rawPer)
    ? Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(rawPer)))
    : DEFAULT_PER_PAGE;
  return { page, perPage, skip: (page - 1) * perPage };
}

/**
 * The one list shape every v2 collection returns. `meta.totalPages` is derived
 * here so no client has to re-do the ceil, and it is at least 1 so "page 1 of
 * 0" never renders on an empty collection.
 */
export function listResponse<T>(items: T[], total: number, p: Page) {
  return NextResponse.json({
    items,
    meta: {
      page: p.page,
      perPage: p.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.perPage)),
    },
  });
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

/** Parse a JSON object body, or return the 422 to bubble up. */
export async function readBody(
  req: NextRequest
): Promise<Record<string, unknown> | NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return validationError([{ field: "body", message: "Invalid JSON body" }]);
  return body as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Serializers for the resources v2 introduces. Resources v1 already serializes
// (cases, runs, results, plans, attachments, fields) reuse those functions so
// the two versions can never drift into different shapes for the same row.
// ---------------------------------------------------------------------------

export function serializeMilestone(m: Milestone, counts?: { runs: number }) {
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    dueDate: m.dueDate ? m.dueDate.toISOString() : null,
    ...(counts ? { runCount: counts.runs } : {}),
  };
}

export function serializeMember(
  m: ProjectMember & { user: Pick<User, "id" | "name" | "email"> }
) {
  return {
    id: m.id,
    userId: m.userId,
    role: m.role,
    name: m.user.name,
    email: m.user.email,
  };
}

// `events` is stored comma-separated (see lib/webhooks); v2 exposes it as a
// real array so clients don't have to know the storage format. The signing
// secret is write-only: returned once by the create handler, never by reads.
export function serializeWebhook(w: Webhook) {
  return {
    id: w.id,
    url: w.url,
    events: w.events ? w.events.split(",").filter(Boolean) : [],
    active: w.active,
    createdAt: w.createdAt.toISOString(),
  };
}

export function serializeEnvironment(e: Environment) {
  return {
    id: e.id,
    name: e.name,
    url: e.url,
    order: e.order,
    active: e.active,
  };
}

export { serializeFieldDef };

export function serializeAttachmentV2(a: Attachment) {
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
