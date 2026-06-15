"use server";

import { db } from "@/lib/db";
import {
  requireSession,
  verifyPassword,
  hashPassword,
  hasUsablePassword,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function isWeakPassword(password: string) {
  return (
    password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
  );
}

// Change password (akun email/password) atau set password (akun OAuth yang
// belum punya). Untuk akun yang sudah punya password, password lama wajib benar.
export async function changePassword(
  _prev: { error?: string; ok?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User tidak ditemukan." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const hadPassword = hasUsablePassword(user.passwordHash);

  if (hadPassword) {
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
      return { error: "Password lama salah." };
  }

  if (isWeakPassword(newPassword))
    return {
      error: "Password minimal 8 karakter dengan 1 huruf besar dan 1 angka.",
    };
  if (newPassword !== confirmPassword)
    return { error: "Konfirmasi password tidak cocok." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await logAudit({
    userId: user.id,
    action: hadPassword ? "account.change_password" : "account.set_password",
  });

  return {
    ok: hadPassword ? "Password berhasil diubah." : "Password berhasil dibuat.",
  };
}
