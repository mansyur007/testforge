"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, type Session } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendMail, actionEmailHtml } from "@/lib/mailer";

export type TeamResult = { error?: string; ok?: string; devLinks?: string[] };

const VALID_MEMBER_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;

// Semua mutasi tim wajib ADMIN dengan organization. Mengembalikan {error} yang
// ramah untuk ditampilkan, bukan throw (agar tidak memunculkan error overlay).
async function adminContext(): Promise<
  { session: Session; organizationId: string } | { error: string }
> {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true, role: true },
  });
  if (!user?.organizationId)
    return { error: "You are not part of an organization yet." };
  if (user.role !== "ADMIN")
    return { error: "Only admins can manage the team." };
  return { session, organizationId: user.organizationId };
}

// Hitung admin lain (selain `exceptUserId`) di organization — untuk mencegah
// organization kehilangan admin terakhir saat demote / remove.
async function otherAdminCount(organizationId: string, exceptUserId: string) {
  return db.user.count({
    where: { organizationId, role: "ADMIN", id: { not: exceptUserId } },
  });
}

// Undang satu/lebih anggota via email. Reuse pola onboardingInvite tapi generik
// & ADMIN-only. Email yang sudah jadi anggota org dilewati.
export async function inviteTeam(formData: FormData): Promise<TeamResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return ctx;

  const emails = Array.from(
    new Set(
      String(formData.get("emails") ?? "")
        .split(/[\n,;]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
  const role = String(formData.get("role") ?? "MEMBER") === "ADMIN" ? "ADMIN" : "MEMBER";
  if (!emails.length) return { error: "Enter at least one valid email." };

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";

  let invited = 0;
  let skipped = 0;
  const devLinks: string[] = [];
  for (const email of emails) {
    const existing = await db.user.findUnique({
      where: { email },
      select: { organizationId: true },
    });
    if (existing?.organizationId === ctx.organizationId) {
      skipped++; // sudah jadi anggota org ini
      continue;
    }

    const token = crypto.randomBytes(24).toString("hex");
    const inv = await db.invitation.upsert({
      where: { organizationId_email: { organizationId: ctx.organizationId, email } },
      create: {
        organizationId: ctx.organizationId,
        email,
        role,
        token,
        invitedById: ctx.session.userId,
      },
      update: { token, role, status: "PENDING" },
    });

    const acceptUrl = `${base}/invite/${inv.token}`;
    const { sent } = await sendMail({
      to: email,
      subject: `You're invited to ${org?.name ?? "TestForge"}`,
      html: actionEmailHtml({
        heading: `Invitation to join ${org?.name ?? "TestForge"}`,
        body: `${ctx.session.name} invited you to join TestForge. Click the button to accept the invitation.`,
        buttonLabel: "Accept invitation",
        actionUrl: acceptUrl,
      }),
      text: `${ctx.session.name} invited you to ${org?.name ?? "TestForge"}.\nAccept: ${acceptUrl}`,
    });
    if (!sent) devLinks.push(acceptUrl);
    invited++;
  }

  await logAudit({
    userId: ctx.session.userId,
    action: "team.invite",
    detail: `${invited} invited${skipped ? `, ${skipped} already members` : ""}`,
  });
  revalidatePath("/settings/team");

  const parts = [`${invited} invitation${invited === 1 ? "" : "s"} sent.`];
  if (skipped) parts.push(`${skipped} already in this organization (skipped).`);
  return { ok: parts.join(" "), devLinks: devLinks.length ? devLinks : undefined };
}

// Kirim ulang undangan PENDING dengan token baru.
export async function resendInvite(formData: FormData): Promise<TeamResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return ctx;

  const id = String(formData.get("invitationId") ?? "");
  const inv = await db.invitation.findUnique({ where: { id } });
  if (!inv || inv.organizationId !== ctx.organizationId)
    return { error: "Invitation not found." };
  if (inv.status === "ACCEPTED")
    return { error: "This invitation was already accepted." };

  const token = crypto.randomBytes(24).toString("hex");
  await db.invitation.update({ where: { id }, data: { token } });

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";
  const acceptUrl = `${base}/invite/${token}`;
  const { sent } = await sendMail({
    to: inv.email,
    subject: `You're invited to ${org?.name ?? "TestForge"}`,
    html: actionEmailHtml({
      heading: `Invitation to join ${org?.name ?? "TestForge"}`,
      body: `${ctx.session.name} invited you to join TestForge. Click the button to accept the invitation.`,
      buttonLabel: "Accept invitation",
      actionUrl: acceptUrl,
    }),
    text: `${ctx.session.name} invited you to ${org?.name ?? "TestForge"}.\nAccept: ${acceptUrl}`,
  });

  await logAudit({
    userId: ctx.session.userId,
    action: "team.invite_resend",
    detail: inv.email,
  });
  revalidatePath("/settings/team");
  return {
    ok: sent
      ? `Invitation resent to ${inv.email}.`
      : `Invite link regenerated (email not configured).`,
    devLinks: sent ? undefined : [acceptUrl],
  };
}

// Batalkan undangan PENDING.
export async function revokeInvite(formData: FormData): Promise<TeamResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return ctx;

  const id = String(formData.get("invitationId") ?? "");
  const inv = await db.invitation.findUnique({ where: { id } });
  if (!inv || inv.organizationId !== ctx.organizationId)
    return { error: "Invitation not found." };

  await db.invitation.delete({ where: { id } });
  await logAudit({
    userId: ctx.session.userId,
    action: "team.invite_revoke",
    detail: inv.email,
  });
  revalidatePath("/settings/team");
  return { ok: `Invitation to ${inv.email} revoked.` };
}

// Ubah role anggota (ADMIN | MEMBER | VIEWER). Tidak bisa ubah diri sendiri;
// tidak boleh menurunkan admin terakhir.
export async function changeMemberRole(formData: FormData): Promise<TeamResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return ctx;

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!VALID_MEMBER_ROLES.includes(role as (typeof VALID_MEMBER_ROLES)[number]))
    return { error: "Invalid role." };
  if (userId === ctx.session.userId)
    return { error: "You can't change your own role." };

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true, email: true },
  });
  if (!target || target.organizationId !== ctx.organizationId)
    return { error: "Member not found in your organization." };

  if (target.role === "ADMIN" && role !== "ADMIN") {
    if ((await otherAdminCount(ctx.organizationId, userId)) === 0)
      return { error: "Can't demote the last admin." };
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  await logAudit({
    userId: ctx.session.userId,
    action: "team.role_change",
    detail: `${target.email} → ${role}`,
  });
  revalidatePath("/settings/team");
  return { ok: `${target.email} is now ${role}.` };
}

// Keluarkan anggota dari organization (set organizationId null). Tidak bisa
// mengeluarkan diri sendiri atau admin terakhir. Keanggotaan project mereka
// (ProjectMember) tidak ikut dihapus karena project tidak ber-organization.
export async function removeMember(formData: FormData): Promise<TeamResult> {
  const ctx = await adminContext();
  if ("error" in ctx) return ctx;

  const userId = String(formData.get("userId") ?? "");
  if (userId === ctx.session.userId)
    return { error: "You can't remove yourself." };

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true, email: true },
  });
  if (!target || target.organizationId !== ctx.organizationId)
    return { error: "Member not found in your organization." };
  if (
    target.role === "ADMIN" &&
    (await otherAdminCount(ctx.organizationId, userId)) === 0
  )
    return { error: "Can't remove the last admin." };

  await db.user.update({
    where: { id: userId },
    data: { organizationId: null, role: "MEMBER" },
  });
  await logAudit({
    userId: ctx.session.userId,
    action: "team.member_remove",
    detail: target.email,
  });
  revalidatePath("/settings/team");
  return { ok: `${target.email} removed from the organization.` };
}
