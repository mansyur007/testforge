"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { SCHEDULE_CRONS } from "@/lib/report-schedules";

// F-17: scheduled email reports — managed on the Notifications page by
// project admins, same gate as notification channels.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireScheduleAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | null> {
  const session = await requireSession();
  if (!(await can(session.userId, projectId, "project.admin"))) return null;
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

export async function createReportSchedule(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireScheduleAdmin(projectId);
  if (!admin) return;

  const cron = String(formData.get("cron"));
  if (!SCHEDULE_CRONS.some((c) => c.key === cron)) return;
  const recipients = String(formData.get("recipients") ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter((r) => EMAIL_RE.test(r));
  if (recipients.length === 0) return;

  await db.reportSchedule.create({
    data: {
      projectId,
      cron,
      recipientsJson: JSON.stringify(recipients),
      createdById: admin.userId,
    },
  });
  await logAudit({
    userId: admin.userId,
    action: "report_schedule.create",
    entityType: "project",
    entityId: projectId,
    detail: `${cron} → ${recipients.length} recipient(s)`,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
}

export async function deleteReportSchedule(formData: FormData): Promise<void> {
  const id = String(formData.get("scheduleId"));
  const schedule = await db.reportSchedule.findUnique({ where: { id } });
  if (!schedule) return;
  const admin = await requireScheduleAdmin(schedule.projectId);
  if (!admin) return;

  await db.reportSchedule.delete({ where: { id } });
  await logAudit({
    userId: admin.userId,
    action: "report_schedule.delete",
    entityType: "project",
    entityId: schedule.projectId,
    detail: schedule.cron,
  });
  revalidatePath(`/projects/${admin.slug}/notifications`);
}
