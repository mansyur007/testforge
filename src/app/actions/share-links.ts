"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";

// F-17: public share links — run.manage members create/revoke; the public
// /share/[token] page itself is read-only and auth-free.

const EXPIRY_DAYS: Record<string, number | null> = {
  never: null,
  "7": 7,
  "30": 30,
};

async function entityProject(
  entityType: string,
  entityId: string
): Promise<{ projectId: string; slug: string; path: string } | null> {
  if (entityType === "RUN") {
    const run = await db.testRun.findUnique({
      where: { id: entityId },
      select: { projectId: true, project: { select: { slug: true } } },
    });
    return run
      ? {
          projectId: run.projectId,
          slug: run.project.slug,
          path: `/projects/${run.project.slug}/runs/${entityId}`,
        }
      : null;
  }
  if (entityType === "DASHBOARD") {
    const dashboard = await db.dashboard.findUnique({
      where: { id: entityId },
      select: { projectId: true, project: { select: { slug: true } } },
    });
    return dashboard
      ? {
          projectId: dashboard.projectId,
          slug: dashboard.project.slug,
          path: `/projects/${dashboard.project.slug}/dashboards/${entityId}`,
        }
      : null;
  }
  return null;
}

export async function createShareLink(formData: FormData): Promise<void> {
  const session = await requireSession();
  const entityType = String(formData.get("entityType"));
  const entityId = String(formData.get("entityId"));
  const entity = await entityProject(entityType, entityId);
  if (!entity) return;
  if (!(await can(session.userId, entity.projectId, "run.manage"))) return;

  const days = EXPIRY_DAYS[String(formData.get("expires") ?? "never")];
  await db.shareLink.create({
    data: {
      token: crypto.randomBytes(32).toString("hex"),
      entityType,
      entityId,
      expiresAt:
        days == null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      createdById: session.userId,
    },
  });
  await logAudit({
    userId: session.userId,
    action: "share_link.create",
    entityType: entityType.toLowerCase(),
    entityId,
    detail: days == null ? "no expiry" : `expires in ${days}d`,
  });
  revalidatePath(entity.path);
}

export async function revokeShareLink(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("shareLinkId"));
  const link = await db.shareLink.findUnique({ where: { id } });
  if (!link || link.revokedAt) return;
  const entity = await entityProject(link.entityType, link.entityId);
  if (!entity) return;
  if (!(await can(session.userId, entity.projectId, "run.manage"))) return;

  await db.shareLink.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  await logAudit({
    userId: session.userId,
    action: "share_link.revoke",
    entityType: link.entityType.toLowerCase(),
    entityId: link.entityId,
  });
  revalidatePath(entity.path);
}
