import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  validationError,
  badRequest,
  type FieldError,
  requirePerm,
} from "@/lib/api";
import { serializeIssueLink } from "@/lib/issues";
import {
  parseIssueKey,
  providerFor,
  displayIssueKey,
} from "@/lib/issue-providers";
import { dispatchWebhook } from "@/lib/webhooks";

// F-07: list & create issue links. Note there is no endpoint that reads an
// Integration — its `authEnc` must never be exposed.

async function findProject(userId: string, slug: string) {
  return db.project.findFirst({
    where: { slug, members: { some: { userId } } },
    select: { id: true },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await findProject(g.userId, params.slug);
  if (!project) return notFoundError("Project not found");

  const sp = req.nextUrl.searchParams;
  const entityType = sp.get("entityType");
  if (entityType && entityType !== "CASE" && entityType !== "RESULT")
    return badRequest("entityType must be CASE or RESULT");

  const cursor = sp.get("cursor");
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);

  const rows = await db.issueLink.findMany({
    where: {
      projectId: project.id,
      ...(entityType ? { entityType } : {}),
      ...(sp.get("entityId") ? { entityId: sp.get("entityId")! } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    items: items.map(serializeIssueLink),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

/** Link an existing issue to a case or result. The key is verified against the
 * tracker, so a typo is a 422 rather than a dangling row. */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const project = await findProject(g.userId, params.slug);
  if (!project) return notFoundError("Project not found");
  const denied = await requirePerm(g.userId, project.id, "run.execute"); // F-14
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const entityType = String(body.entityType ?? "");
  if (entityType !== "CASE" && entityType !== "RESULT")
    errors.push({ field: "entityType", message: "must be CASE or RESULT" });

  const entityId = String(body.entityId ?? "");
  if (!entityId) errors.push({ field: "entityId", message: "entityId is required" });

  if (errors.length) return validationError(errors);

  // The entity must live in this project (tenant guard).
  const entityOk =
    entityType === "CASE"
      ? await db.testCase.findFirst({
          where: { id: entityId, projectId: project.id },
          select: { id: true },
        })
      : await db.testRunResult.findFirst({
          where: { id: entityId, run: { projectId: project.id } },
          select: { id: true },
        });
  if (!entityOk)
    return validationError([
      { field: "entityId", message: "not found in this project" },
    ]);

  const requested = body.provider ? String(body.provider).toUpperCase() : undefined;
  const integrations = await db.integration.findMany({
    where: { projectId: project.id, active: true, ...(requested ? { provider: requested } : {}) },
  });
  if (integrations.length === 0)
    return validationError([
      { field: "provider", message: "no active issue tracker for this project" },
    ]);
  if (integrations.length > 1 && !requested)
    return validationError([
      { field: "provider", message: "several trackers configured — specify one" },
    ]);
  const integration = integrations[0];

  const key = parseIssueKey(integration.provider, String(body.issueKey ?? ""));
  if (!key)
    return validationError([
      { field: "issueKey", message: "unrecognized issue key or URL" },
    ]);

  const duplicate = await db.issueLink.findFirst({
    where: {
      projectId: project.id,
      provider: integration.provider,
      issueKey: key,
      entityType,
      entityId,
    },
  });
  if (duplicate) return NextResponse.json(serializeIssueLink(duplicate));

  let issue;
  try {
    issue = await providerFor(integration).getIssue(key);
  } catch (err) {
    return validationError([
      { field: "issueKey", message: `tracker rejected it: ${(err as Error).message}` },
    ]);
  }

  const link = await db.issueLink.create({
    data: {
      projectId: project.id,
      provider: integration.provider,
      issueKey: issue.key,
      issueUrl: issue.url,
      title: issue.title ?? null,
      status: issue.status ?? null,
      syncedAt: new Date(),
      entityType,
      entityId,
    },
  });

  await logAudit({
    userId: g.userId,
    action: "issue.link",
    entityType: entityType.toLowerCase(),
    entityId,
    detail: `${integration.provider} ${displayIssueKey(integration.provider, issue.key)}`,
  });
  await dispatchWebhook(project.id, "issue.created", serializeIssueLink(link));

  return NextResponse.json(serializeIssueLink(link), { status: 201 });
}
