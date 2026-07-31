"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import {
  clearSuperadminSession,
  createSuperadminSession,
  superadminEnabled,
  verifySuperadminCredentials,
} from "@/lib/superadmin";

// F-41: sign-in for the instance console. Same in-memory lockout shape as the
// normal login action (src/app/actions/auth.ts) — per-process, resets on
// restart, which is adequate for the single-container deploy.
const failed = new Map<string, { count: number; firstAt: number }>();
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MAX = 5;

function clientIp() {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function lockedOut(key: string) {
  const entry = failed.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failed.delete(key);
    return false;
  }
  return entry.count >= LOCKOUT_MAX;
}

function recordFailure(key: string) {
  const entry = failed.get(key);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failed.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export async function superadminLogin(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  if (!superadminEnabled()) return { error: "Not available." };

  const ip = clientIp();
  if (lockedOut(ip)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const ok = await verifySuperadminCredentials(username, password);
  if (!ok) {
    recordFailure(ip);
    // One generic message — never reveal whether the username was the miss.
    await logAudit({
      action: "instance.login.failed",
      entityType: "INSTANCE",
      detail: `ip=${ip}`,
    });
    return { error: "Invalid credentials." };
  }

  failed.delete(ip);
  await createSuperadminSession(username);
  await logAudit({
    action: "instance.login",
    entityType: "INSTANCE",
    detail: `${username} · ip=${ip}`,
  });
  redirect("/superadmin");
}

export async function superadminLogout() {
  clearSuperadminSession();
  redirect("/superadmin/login");
}
