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
  if (!user) return { error: "User not found." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const hadPassword = hasUsablePassword(user.passwordHash);

  if (hadPassword) {
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
      return { error: "Current password is incorrect." };
  }

  if (isWeakPassword(newPassword))
    return {
      error:
        "Password must be at least 8 characters with 1 uppercase letter and 1 number.",
    };
  if (newPassword !== confirmPassword)
    return { error: "Passwords do not match." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await logAudit({
    userId: user.id,
    action: hadPassword ? "account.change_password" : "account.set_password",
  });

  return {
    ok: hadPassword
      ? "Password changed successfully."
      : "Password set successfully.",
  };
}
