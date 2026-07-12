"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { can } from "@/lib/permissions";

export async function createWebhook(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSession();

  const projectId = String(formData.get("projectId"));
  if (!(await isProjectMember(session.userId, projectId)))
    return { error: "Project not found." };
  // F-14: webhooks are project administration.
  if (!(await can(session.userId, projectId, "project.admin")))
    return { error: "You don't have permission to manage webhooks." };

  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\/.+/.test(url))
    return { error: "Enter a valid http(s) URL." };

  // Only keep known events; default to all if none were ticked.
  const picked = formData.getAll("events").map(String);
  const events = WEBHOOK_EVENTS.filter((e) => picked.includes(e));
  const eventList = (events.length ? events : WEBHOOK_EVENTS).join(",");

  await db.webhook.create({
    data: {
      projectId,
      url,
      events: eventList,
      secret: `whsec_${crypto.randomBytes(24).toString("hex")}`,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "webhook.create",
    entityType: "project",
    entityId: projectId,
    detail: url,
  });
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (project) revalidatePath(`/projects/${project.slug}/api`);
  return { ok: true };
}

export async function deleteWebhook(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("webhookId"));
  const hook = await db.webhook.findFirst({
    where: { id, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { slug: true } } },
  });
  if (!hook) return;

  await db.webhook.delete({ where: { id } });
  await logAudit({
    userId: session.userId,
    action: "webhook.delete",
    entityType: "project",
    entityId: hook.projectId,
    detail: hook.url,
  });
  revalidatePath(`/projects/${hook.project.slug}/api`);
}
