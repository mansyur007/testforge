import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  readPage,
  listResponse,
  withRate,
  validationError,
  serializeWebhook,
  type FieldError,
} from "@/lib/api-v2";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

// F-33: outbound webhooks. The signing secret is generated server-side and
// returned exactly once, in the 201 body — reads never echo it. A caller that
// loses it must rotate (PATCH ?rotateSecret=true on the item route).

function validateEvents(raw: unknown, errors: FieldError[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    errors.push({ field: "events", message: "at least one event is required" });
    return [];
  }
  const events = raw.map(String);
  const unknown = events.filter(
    (e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e)
  );
  if (unknown.length)
    errors.push({
      field: "events",
      message: `unknown event(s): ${unknown.join(", ")}`,
    });
  return Array.from(new Set(events));
}

function validateUrl(raw: unknown, errors: FieldError[]): string {
  const url = String(raw ?? "").trim();
  if (!url) {
    errors.push({ field: "url", message: "url is required" });
    return "";
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    errors.push({ field: "url", message: "must be an absolute URL" });
    return url;
  }
  if (!["http:", "https:"].includes(parsed.protocol))
    errors.push({ field: "url", message: "must be http or https" });
  return url;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  // Webhook config is project administration, not general read data.
  const denied = await requirePerm(ctx.userId, project.id, "project.admin");
  if (denied) return denied;

  const where = { projectId: project.id };
  const p = readPage(req);
  const [rows, total] = await Promise.all([
    db.webhook.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: p.skip,
      take: p.perPage,
    }),
    db.webhook.count({ where }),
  ]);

  return withRate(listResponse(rows.map(serializeWebhook), total, p), ctx);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "project.admin");
  if (denied) return denied;

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const url = validateUrl(body.url, errors);
  const events = validateEvents(body.events, errors);
  if (errors.length) return validationError(errors);

  const secret = crypto.randomBytes(32).toString("hex");
  const webhook = await db.webhook.create({
    data: {
      projectId: project.id,
      url,
      secret,
      events: events.join(","),
      active: body.active === undefined ? true : body.active === true,
    },
  });

  await logAudit({
    userId: ctx.userId,
    action: "webhook.create",
    entityType: "project",
    entityId: project.id,
    detail: url,
  });

  return withRate(
    NextResponse.json({ ...serializeWebhook(webhook), secret }, { status: 201 }),
    ctx
  );
}
