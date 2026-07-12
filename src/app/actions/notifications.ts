"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { encrypt } from "@/lib/crypto";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import {
  CHANNEL_TYPES,
  notifyBaseUrl,
  sendToChannel,
  validateWebhookTarget,
  type ChannelType,
} from "@/lib/notifications";
import { can } from "@/lib/permissions";

// F-08: manage a project's notification channels. OWNER/ADMIN only (same
// gate as member management — canManageMembers covers exactly those roles).

type ActionResult = { error?: string; ok?: boolean };

async function requireChannelAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | { error: string }> {
  const session = await requireSession();
  // F-14: central permission check (covers custom roles too).
  if (!(await can(session.userId, projectId, "project.admin")))
    return { error: "Only project owners/admins can manage notifications." };
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

// Parse + validate the form's target into a storable configJson, or an error.
function buildConfig(
  type: ChannelType,
  formData: FormData
): { configJson: string } | { error: string } {
  if (type === "EMAIL") {
    const to = String(formData.get("to") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!to.length) return { error: "Enter at least one recipient email." };
    const bad = to.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad) return { error: `Invalid email address: ${bad}` };
    return { configJson: JSON.stringify({ to }) };
  }
  const webhookUrl = String(formData.get("webhookUrl") ?? "").trim();
  const invalid = validateWebhookTarget(type, webhookUrl);
  if (invalid) return { error: invalid };
  // Chat webhook URLs are bearer secrets — stored encrypted at rest.
  return { configJson: encrypt(JSON.stringify({ webhookUrl })) };
}

function readEvents(formData: FormData): string {
  const picked = formData.getAll("events").map(String);
  const events = WEBHOOK_EVENTS.filter((e) => picked.includes(e));
  return (events.length ? events : WEBHOOK_EVENTS).join(",");
}

export async function createChannel(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireChannelAdmin(projectId);
  if ("error" in admin) return admin;

  const type = String(formData.get("type")) as ChannelType;
  if (!CHANNEL_TYPES.includes(type)) return { error: "Unknown channel type." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Channel name is required." };

  const config = buildConfig(type, formData);
  if ("error" in config) return config;

  await db.notificationChannel.create({
    data: {
      projectId,
      type,
      name,
      configJson: config.configJson,
      events: readEvents(formData),
    },
  });

  await logAudit({
    userId: admin.userId,
    action: "notification.create",
    entityType: "project",
    entityId: projectId,
    detail: `${type} ${name}`,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
  return { ok: true };
}

export async function updateChannel(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const id = String(formData.get("channelId"));
  const channel = await db.notificationChannel.findUnique({ where: { id } });
  if (!channel) return { error: "Channel not found." };
  const admin = await requireChannelAdmin(channel.projectId);
  if ("error" in admin) return admin;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Channel name is required." };

  // Target field left blank = keep the stored one (it's never echoed back).
  const hasNewTarget =
    channel.type === "EMAIL"
      ? String(formData.get("to") ?? "").trim() !== ""
      : String(formData.get("webhookUrl") ?? "").trim() !== "";
  let configJson = channel.configJson;
  if (hasNewTarget) {
    const config = buildConfig(channel.type as ChannelType, formData);
    if ("error" in config) return config;
    configJson = config.configJson;
  }

  await db.notificationChannel.update({
    where: { id },
    data: { name, configJson, events: readEvents(formData) },
  });

  await logAudit({
    userId: admin.userId,
    action: "notification.update",
    entityType: "project",
    entityId: channel.projectId,
    detail: `${channel.type} ${name}`,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
  return { ok: true };
}

export async function toggleChannel(formData: FormData): Promise<void> {
  const id = String(formData.get("channelId"));
  const channel = await db.notificationChannel.findUnique({ where: { id } });
  if (!channel) return;
  const admin = await requireChannelAdmin(channel.projectId);
  if ("error" in admin) return;

  await db.notificationChannel.update({
    where: { id },
    data: { active: !channel.active },
  });
  await logAudit({
    userId: admin.userId,
    action: "notification.update",
    entityType: "project",
    entityId: channel.projectId,
    detail: `${channel.name} → ${channel.active ? "inactive" : "active"}`,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
}

export async function deleteChannel(formData: FormData): Promise<void> {
  const id = String(formData.get("channelId"));
  const channel = await db.notificationChannel.findUnique({ where: { id } });
  if (!channel) return;
  const admin = await requireChannelAdmin(channel.projectId);
  if ("error" in admin) return;

  await db.notificationChannel.delete({ where: { id } });
  await logAudit({
    userId: admin.userId,
    action: "notification.delete",
    entityType: "project",
    entityId: channel.projectId,
    detail: `${channel.type} ${channel.name}`,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
}

// "Send test message" — awaited (unlike real deliveries) so the UI can report
// success/failure inline.
export async function testChannel(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const id = String(formData.get("channelId"));
  const channel = await db.notificationChannel.findUnique({ where: { id } });
  if (!channel) return { error: "Channel not found." };
  const admin = await requireChannelAdmin(channel.projectId);
  if ("error" in admin) return admin;

  try {
    await sendToChannel(channel, "run.completed", {
      title: "Test message from TestForge",
      url: `${notifyBaseUrl()}/projects/${admin.slug}`,
      tone: "neutral",
      fields: [{ label: "Channel", value: channel.name }],
    });
  } catch (err) {
    return { error: `Delivery failed: ${(err as Error).message}` };
  }

  await logAudit({
    userId: admin.userId,
    action: "notification.test",
    entityType: "project",
    entityId: channel.projectId,
    detail: channel.name,
  });
  return { ok: true };
}
