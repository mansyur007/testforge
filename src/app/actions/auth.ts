"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  clearSession,
  hashPassword,
  verifyPassword,
  getSession,
} from "@/lib/auth";
import {
  createToken,
  consumeToken,
  isResendCoolingDown,
  sendAuthEmail,
  TOKEN_TYPES,
} from "@/lib/tokens";
import { logAudit } from "@/lib/audit";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

// Pesan error mengikuti bahasa pilihan user (cookie tf_lang, default en)
function msgs() {
  return dict[resolveLang(cookies().get(LANG_COOKIE)?.value)].auth.errors;
}

const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MAX = 5;

// Rate limiting login per email & per IP (PRD §12.6.2 / AU-009)
function isLockedOut(key: string) {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= LOCKOUT_MAX;
}

function recordFailure(key: string) {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

// PRD §12.2.1: domain email sekali pakai ditolak
const BLACKLISTED_DOMAINS = [
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
];

function slugifyOrg(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

// PRD §12.2.1: min 8 karakter, 1 huruf besar, 1 angka
function isWeakPassword(password: string) {
  return (
    password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
  );
}

export async function register(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const orgSlug =
    String(formData.get("orgSlug") ?? "").trim().toLowerCase() ||
    slugifyOrg(orgName);
  const agreed = formData.get("agreeTerms") === "on";

  // Validasi sesuai PRD §12.2.1
  const t = msgs();
  if (name.length < 2 || name.length > 100) return { error: t.nameLength };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: t.invalidEmail };
  const domain = email.split("@")[1];
  if (BLACKLISTED_DOMAINS.includes(domain)) return { error: t.tempEmail };
  if (isWeakPassword(password)) return { error: t.passwordWeak };
  if (password !== confirmPassword) return { error: t.confirmMismatch };
  if (orgName.length < 2 || orgName.length > 100)
    return { error: t.orgLength };
  if (!/^[a-z0-9-]+$/.test(orgSlug)) return { error: t.slugFormat };
  if (!agreed) return { error: t.mustAgree };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: t.emailTaken };

  const slugTaken = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (slugTaken) return { error: t.slugTaken(orgSlug) };

  // User pertama otomatis ADMIN
  const userCount = await db.user.count();
  const org = await db.organization.create({
    data: { name: orgName, slug: orgSlug },
  });
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: userCount === 0 ? "ADMIN" : "MEMBER",
      organizationId: org.id,
    },
  });

  // PRD §12.3 langkah 3: kirim email verifikasi → redirect /verify-email
  const raw = await createToken(user.id, TOKEN_TYPES.VERIFY_EMAIL);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";
  await sendAuthEmail({
    to: email,
    subject: "Verifikasi email kamu - TestForge",
    actionUrl: `${base}/verify?token=${raw}`,
  });

  await logAudit({ userId: user.id, action: "auth.register", detail: orgName });
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function resendVerification(
  _prev: { error?: string; ok?: string; devLink?: string } | undefined,
  formData: FormData
) {
  const t = msgs();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  // jangan bocorkan keberadaan akun
  if (!user || user.emailVerifiedAt) return { ok: t.resendNeutral };

  // PRD §12.5: cooldown 60 detik
  if (await isResendCoolingDown(user.id, TOKEN_TYPES.VERIFY_EMAIL))
    return { error: t.resendCooldown };

  const raw = await createToken(user.id, TOKEN_TYPES.VERIFY_EMAIL);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";
  const result = await sendAuthEmail({
    to: email,
    subject: "Verifikasi email kamu - TestForge",
    actionUrl: `${base}/verify?token=${raw}`,
  });

  return {
    ok: t.resendOk,
    devLink: result.devLink, // mode dev tanpa SMTP: tampilkan link langsung
  };
}

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";
  const next = String(formData.get("next") ?? "");

  const t = msgs();
  if (isLockedOut(email)) return { error: t.lockedOut };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(email);
    return { error: t.wrongCredentials };
  }

  // AU-001: verifikasi email wajib sebelum login
  if (!user.emailVerifiedAt) {
    return { error: t.notVerified };
  }

  failedAttempts.delete(email);
  await logAudit({ userId: user.id, action: "auth.login" });
  await createSession(user, rememberMe);

  // PRD §12.3 langkah 6–7: first login → onboarding wizard
  if (!user.onboardedAt) redirect("/onboarding");
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

export async function verifyEmailToken(rawToken: string) {
  const userId = await consumeToken(rawToken, TOKEN_TYPES.VERIFY_EMAIL);
  if (!userId) return { error: msgs().invalidVerifyToken };

  const user = await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await logAudit({ userId, action: "auth.verify_email" });

  // PRD §12.5: jika sudah ada session aktif → /onboarding, jika belum → /login
  const session = await getSession();
  return {
    ok: true,
    next: session && session.userId === user.id ? "/onboarding" : "/login?verified=1",
  };
}

export async function forgotPassword(
  _prev: { error?: string; ok?: string; devLink?: string } | undefined,
  formData: FormData
) {
  const t = msgs();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  // jangan bocorkan keberadaan akun
  if (!user) return { ok: t.forgotNeutral };

  if (await isResendCoolingDown(user.id, TOKEN_TYPES.RESET_PASSWORD))
    return { error: t.resendCooldown };

  // AU-008: link reset valid 1 jam
  const raw = await createToken(user.id, TOKEN_TYPES.RESET_PASSWORD);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3456";
  const result = await sendAuthEmail({
    to: email,
    subject: "Reset password - TestForge",
    actionUrl: `${base}/reset-password?token=${raw}`,
  });

  await logAudit({ userId: user.id, action: "auth.forgot_password" });
  return { ok: t.forgotNeutral, devLink: result.devLink };
}

export async function resetPassword(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const t = msgs();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (isWeakPassword(password)) return { error: t.passwordWeak };
  if (password !== confirmPassword) return { error: t.confirmMismatch };

  const userId = await consumeToken(token, TOKEN_TYPES.RESET_PASSWORD);
  if (!userId) return { error: t.invalidResetToken };

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });
  await logAudit({ userId, action: "auth.reset_password" });
  redirect("/login?reset=1");
}

export async function logout() {
  clearSession();
  redirect("/login");
}
