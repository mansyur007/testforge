"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendMail, actionEmailHtml } from "@/lib/mailer";

// Pastikan user punya organization (user OAuth dibuat tanpa org). Dipakai sebelum
// mengundang tim, agar undangan punya tempat bernaung.
async function ensureOrganization(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user?.organizationId) return user.organizationId;

  const base =
    (user?.name ?? "workspace")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24) || "workspace";
  let slug = base;
  for (let i = 2; await db.organization.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  const org = await db.organization.create({
    data: { name: `${user?.name ?? "My"} Workspace`, slug },
  });
  await db.user.update({
    where: { id: userId },
    data: { organizationId: org.id },
  });
  return org.id;
}

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
  if (!name) return { error: "Project name is required." };

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

  if (!emails.length) return { error: "Enter at least one valid email." };

  // User OAuth bisa belum punya org — buat otomatis di sini.
  const organizationId = await ensureOrganization(session.userId);
  const org = await db.organization.findUnique({ where: { id: organizationId } });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";

  let invited = 0;
  const devLinks: string[] = [];
  for (const email of emails) {
    const token = crypto.randomBytes(24).toString("hex");
    const inv = await db.invitation.upsert({
      where: { organizationId_email: { organizationId, email } },
      create: {
        organizationId,
        email,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        token,
        invitedById: session.userId,
      },
      // jika sudah pernah diundang & belum punya token, set token baru
      update: { token },
    });

    const acceptUrl = `${base}/invite/${inv.token}`;
    const { sent } = await sendMail({
      to: email,
      subject: `You're invited to ${org?.name ?? "TestForge"}`,
      html: actionEmailHtml({
        heading: `Invitation to join ${org?.name ?? "TestForge"}`,
        body: `${session.name} invited you to join TestForge. Click the button to accept the invitation.`,
        buttonLabel: "Accept invitation",
        actionUrl: acceptUrl,
      }),
      text: `${session.name} invited you to ${org?.name ?? "TestForge"}.\nAccept: ${acceptUrl}`,
    });
    if (!sent) devLinks.push(acceptUrl); // fallback tanpa SMTP
    invited++;
  }

  await logAudit({
    userId: session.userId,
    action: "onboarding.invite",
    detail: `${invited} invitations`,
  });
  return { ok: true, invited, devLinks: devLinks.length ? devLinks : undefined };
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
