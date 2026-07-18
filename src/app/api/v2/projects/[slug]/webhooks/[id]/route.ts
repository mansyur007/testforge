import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guardV2,
  resolveProject,
  requirePerm,
  readBody,
  withRate,
  notFoundError,
  validationError,
  serializeWebhook,
  type FieldError,
} from "@/lib/api-v2";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

// F-33: single webhook. `?rotateSecret=true` on PATCH mints a fresh signing
// secret and returns it once — the only way to recover from a leaked secret
// without recreating the subscription.

async function load(slug: string, id: string, userId: string) {
  return db.webhook.findFirst({
    where: { id, project: { slug, members: { some: { userId } } } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req);
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "project.admin");
  if (denied) return denied;

  const w = await load(params.slug, params.id, ctx.userId);
  if (!w) return notFoundError("Webhook not found");
  return withRate(NextResponse.json(serializeWebhook(w)), ctx);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "project.admin");
  if (denied) return denied;

  const w = await load(params.slug, params.id, ctx.userId);
  if (!w) return notFoundError("Webhook not found");

  const body = await readBody(req);
  if (body instanceof NextResponse) return body;

  const errors: FieldError[] = [];
  const data: {
    url?: string;
    events?: string;
    active?: boolean;
    secret?: string;
  } = {};

  if ("url" in body) {
    const url = String(body.url ?? "").trim();
    let ok = false;
    try {
      ok = ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
      ok = false;
    }
    if (!ok)
      errors.push({ field: "url", message: "must be an absolute http(s) URL" });
    else data.url = url;
  }

  if ("events" in body) {
    if (!Array.isArray(body.events) || body.events.length === 0)
      errors.push({
        field: "events",
        message: "at least one event is required",
      });
    else {
      const events = Array.from(new Set(body.events.map(String)));
      const unknown = events.filter(
        (e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e)
      );
      if (unknown.length)
        errors.push({
          field: "events",
          message: `unknown event(s): ${unknown.join(", ")}`,
        });
      else data.events = events.join(",");
    }
  }

  if ("active" in body) data.active = body.active === true;
  if (errors.length) return validationError(errors);

  const rotate = req.nextUrl.searchParams.get("rotateSecret") === "true";
  const secret = rotate ? crypto.randomBytes(32).toString("hex") : null;
  if (secret) data.secret = secret;

  const updated = await db.webhook.update({ where: { id: w.id }, data });

  await logAudit({
    userId: ctx.userId,
    action: rotate ? "webhook.rotate_secret" : "webhook.update",
    entityType: "project",
    entityId: project.id,
    detail: updated.url,
  });

  return withRate(
    NextResponse.json({
      ...serializeWebhook(updated),
      ...(secret ? { secret } : {}),
    }),
    ctx
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const ctx = await guardV2(req, { write: true });
  if (ctx instanceof NextResponse) return ctx;
  const project = await resolveProject(ctx, params.slug);
  if (project instanceof NextResponse) return project;
  const denied = await requirePerm(ctx.userId, project.id, "project.admin");
  if (denied) return denied;

  const w = await load(params.slug, params.id, ctx.userId);
  if (!w) return notFoundError("Webhook not found");

  await db.webhook.delete({ where: { id: w.id } });

  await logAudit({
    userId: ctx.userId,
    action: "webhook.delete",
    entityType: "project",
    entityId: project.id,
    detail: w.url,
  });

  return withRate(new NextResponse(null, { status: 204 }), ctx);
}
