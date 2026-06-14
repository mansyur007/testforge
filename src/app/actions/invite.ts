"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Terima undangan tim (dari email /invite/[token]). Wajib sudah login sebagai
// email yang diundang. Menggabungkan user ke organization pengundang.
export async function acceptInvite(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const token = String(formData.get("token") ?? "");
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const inv = await db.invitation.findUnique({ where: { token } });
  if (!inv) return { error: "Undangan tidak ditemukan atau sudah kedaluwarsa." };
  if (inv.status === "ACCEPTED")
    return { error: "Undangan ini sudah pernah diterima." };
  if (inv.email.toLowerCase() !== session!.email.toLowerCase())
    return {
      error: `Undangan ini untuk ${inv.email}. Masuk dengan akun email tersebut untuk menerimanya.`,
    };

  await db.user.update({
    where: { id: session!.userId },
    data: {
      organizationId: inv.organizationId,
      role: inv.role === "ADMIN" ? "ADMIN" : "MEMBER",
    },
  });
  await db.invitation.update({
    where: { id: inv.id },
    data: { status: "ACCEPTED" },
  });
  await logAudit({
    userId: session!.userId,
    action: "invite.accept",
    detail: inv.organizationId,
  });
  redirect("/dashboard");
}
