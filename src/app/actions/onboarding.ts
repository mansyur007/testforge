"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Template project (PRD §12.4 Step 1): blank / web app / mobile app / API
const TEMPLATE_SUITES: Record<string, string[]> = {
  blank: [],
  web: ["Authentication", "Navigation", "Forms", "Responsive Layout"],
  mobile: ["Onboarding", "Push Notification", "Offline Mode", "Deep Linking"],
  api: ["Authentication", "CRUD Endpoints", "Error Handling", "Rate Limiting"],
};

export async function onboardingCreateProject(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const template = String(formData.get("template") ?? "blank");
  if (!name) return { error: "Nama project wajib diisi." };

  const baseSlug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 20) ||
    "project";
  let slug = baseSlug;
  for (let i = 2; await db.project.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const project = await db.project.create({
    data: {
      name,
      slug,
      description: description || null,
      createdById: session.userId,
      members: { create: { userId: session.userId, role: "OWNER" } },
      suites: {
        create: (TEMPLATE_SUITES[template] ?? []).map((s, i) => ({
          name: s,
          order: i,
        })),
      },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "onboarding.create_project",
    entityType: "project",
    entityId: project.id,
    detail: `${name} (template: ${template})`,
  });
  return { ok: true, projectSlug: project.slug };
}

export async function onboardingInvite(formData: FormData) {
  const session = await requireSession();
  const emails = String(formData.get("emails") ?? "")
    .split(/[\n,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  const role = String(formData.get("role") ?? "MEMBER");

  if (!emails.length) return { error: "Masukkan minimal satu email valid." };

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user?.organizationId)
    return { error: "Akun ini tidak punya organization (akun lama). Lewati langkah ini." };

  let invited = 0;
  for (const email of emails) {
    await db.invitation.upsert({
      where: {
        organizationId_email: { organizationId: user.organizationId, email },
      },
      create: {
        organizationId: user.organizationId,
        email,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        invitedById: session.userId,
      },
      update: {},
    });
    invited++;
  }

  await logAudit({
    userId: session.userId,
    action: "onboarding.invite",
    detail: `${invited} undangan`,
  });
  // Catatan: email undangan terkirim saat SMTP dikonfigurasi (lihat AUDIT-PRD.md)
  return { ok: true, invited };
}

export async function onboardingIntegrations(formData: FormData) {
  const session = await requireSession();
  const selected = formData.getAll("integrations").map(String);
  if (selected.length) {
    await logAudit({
      userId: session.userId,
      action: "onboarding.integrations_interest",
      detail: selected.join(", "),
    });
  }
  return { ok: true };
}

export async function completeOnboarding() {
  const session = await requireSession();
  await db.user.update({
    where: { id: session.userId },
    data: { onboardedAt: new Date() },
  });
  await logAudit({ userId: session.userId, action: "onboarding.complete" });
}
