"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  clearSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MAX = 5;

// Brute force protection: lockout setelah 5 gagal dalam 5 menit (PRD §8)
function isLockedOut(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(email);
    return false;
  }
  return entry.count >= LOCKOUT_MAX;
}

function recordFailure(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export async function register(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Nama, email valid, dan password minimal 8 karakter wajib diisi." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email sudah terdaftar." };

  // User pertama otomatis jadi ADMIN
  const userCount = await db.user.count();
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: userCount === 0 ? "ADMIN" : "MEMBER",
    },
  });

  await logAudit({ userId: user.id, action: "auth.register" });
  await createSession(user);
  redirect("/dashboard");
}

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (isLockedOut(email)) {
    return { error: "Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(email);
    return { error: "Email atau password salah." };
  }

  failedAttempts.delete(email);
  await logAudit({ userId: user.id, action: "auth.login" });
  await createSession(user);
  redirect("/dashboard");
}

export async function logout() {
  clearSession();
  redirect("/login");
}
