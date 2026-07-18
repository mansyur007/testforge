"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  clearSession,
  hashPassword,
  verifyPassword,
  getSession,
  createPending2fa,
  readPending2fa,
  clearPending2fa,
} from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { verifyTotp } from "@/lib/totp";
import { sha256Hex, normalizeRecoveryCode } from "@/lib/two-factor";
import {
  createToken,
  consumeToken,
  isResendCoolingDown,
  sendAuthEmail,
  TOKEN_TYPES,
} from "@/lib/tokens";
import { logAudit } from "@/lib/audit";
import {
  ldapEnabled,
  ldapConfig,
  authenticateLdap,
  type LdapConfig,
} from "@/lib/ldap";
import crypto from "crypto";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

// Pesan error mengikuti bahasa pilihan user (cookie tf_lang, default en)
function msgs() {
  return dict[resolveLang(cookies().get(LANG_COOKIE)?.value)].auth.errors;
}

const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MAX = 5;

// F-20: an operator can disable password auth entirely (SSO/social only). Every
// password-touching action rejects server-side, not just in the hidden UI.
const PASSWORD_LOGIN_DISABLED_MSG = "Password login is disabled on this instance.";
function passwordLoginDisabled() {
  return process.env.TF_DISABLE_PASSWORD_LOGIN === "1";
}

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

  if (passwordLoginDisabled()) return { error: PASSWORD_LOGIN_DISABLED_MSG };

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

  // The registrant creates and owns this organization, so they are its ADMIN.
  const org = await db.organization.create({
    data: { name: orgName, slug: orgSlug },
  });
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
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

// F-34: resolves the org that LDAP-provisioned accounts join. Self-hosted
// instances normally have exactly one org, so that is the zero-config default;
// TF_LDAP_ORG_SLUG is only needed when an instance has several.
async function resolveLdapOrg(slug: string) {
  if (slug) return db.organization.findUnique({ where: { slug } });
  const orgs = await db.organization.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  return orgs.length === 1 ? orgs[0] : null;
}

// F-34: authenticate against the directory and map the result onto a local
// user. Exactly one of the two fields is meaningful: `user` on success, or
// `error` to surface at /login — where a null `error` means "rejected, fall
// through to the generic wrong-credentials message".
type LdapLoginOutcome = { user?: User; error?: string | null };

async function loginViaLdap(
  cfg: LdapConfig,
  username: string,
  password: string
): Promise<LdapLoginOutcome> {
  const result = await authenticateLdap(cfg, username, password);
  if (!result.ok) {
    if (result.reason === "no_email")
      return { error: "Your directory entry has no email address. Ask an admin." };
    // "not_found" and "error" deliberately look identical to a wrong password:
    // telling an attacker which usernames exist in the directory is a leak.
    return { error: null as string | null };
  }

  const { email, name } = result.user;
  let user = await db.user.findUnique({ where: { email } });

  if (!user) {
    if (!cfg.autoProvision)
      return { error: `No TestForge account for ${email}. Ask an admin to invite you.` };
    const org = await resolveLdapOrg(cfg.orgSlug);
    if (!org) {
      console.error("[ldap] cannot resolve an organization for auto-provisioning");
      return { error: "Directory login is misconfigured on this instance. Ask an admin." };
    }
    user = await db.user.create({
      data: {
        name,
        email,
        // No usable password — the directory owns this account's credentials.
        // Same "no local password" convention as OAuth/OIDC users.
        passwordHash: crypto.randomBytes(32).toString("hex"),
        role:
          cfg.defaultRole === "ADMIN" ? "ADMIN" : cfg.defaultRole === "VIEWER" ? "VIEWER" : "MEMBER",
        organizationId: org.id,
        // The directory is the authority on this address; no email round-trip.
        emailVerifiedAt: new Date(),
      },
    });
    await logAudit({ userId: user.id, action: "auth.register_ldap" });
  } else if (!user.emailVerifiedAt) {
    // An existing local account that had never verified: the directory just
    // asserted the address, so AU-001 is satisfied.
    user = await db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  return { user };
}

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  // With LDAP this field holds a directory username (e.g. `jdoe`) rather than an
  // email, so it is not validated as an address here.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";
  const next = String(formData.get("next") ?? "");

  const t = msgs();
  // F-34: TF_DISABLE_PASSWORD_LOGIN switches off *local* passwords. When LDAP is
  // configured the form stays live, because directory credentials are exactly
  // how an LDAP-only instance is meant to be used.
  const ldapCfg = ldapEnabled() ? ldapConfig() : null;
  const localPasswordEnabled = !passwordLoginDisabled();
  if (!localPasswordEnabled && !ldapCfg) return { error: PASSWORD_LOGIN_DISABLED_MSG };
  if (isLockedOut(email)) return { error: t.lockedOut };

  let user = localPasswordEnabled ? await db.user.findUnique({ where: { email } }) : null;
  let authOk = !!user && (await verifyPassword(password, user!.passwordHash));
  let viaLdap = false;

  // F-34: the directory is a fallback, not a replacement — local accounts (the
  // bootstrap admin above all) keep working even when LDAP is down.
  if (!authOk && ldapCfg) {
    const outcome = await loginViaLdap(ldapCfg, email, password);
    if (outcome.user) {
      user = outcome.user;
      authOk = true;
      viaLdap = true;
    } else if (outcome.error) {
      recordFailure(email);
      return { error: outcome.error };
    }
  }

  if (!user || !authOk) {
    recordFailure(email);
    return { error: t.wrongCredentials };
  }

  // AU-001: verifikasi email wajib sebelum login.
  // Password sudah benar di atas, jadi aman mengarahkan ke halaman verify-email
  // (punya tombol resend) tanpa membocorkan status akun ke yang tak tahu password.
  if (!user.emailVerifiedAt) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  // F-20: when 2FA is on, a correct password does NOT create a session — it only
  // mints the short-lived pending token and hands off to the second step. The
  // lockout counter is intentionally left intact so wrong TOTP codes at
  // /login/2fa keep drawing down the same budget as wrong passwords.
  //
  // F-34: LDAP logins go through this step too, unlike OIDC. An OIDC provider
  // owns its own MFA policy, but an LDAP bind is only a password check — so the
  // app's TOTP stays the second factor.
  if (user.totpEnabledAt) {
    await createPending2fa({ userId: user.id, rememberMe, next });
    redirect("/login/2fa");
  }

  failedAttempts.delete(email);
  await logAudit({ userId: user.id, action: "auth.login", ...(viaLdap && { detail: "ldap" }) });
  await createSession(user, rememberMe);

  // PRD §12.3 langkah 6–7: first login → onboarding wizard
  if (!user.onboardedAt) redirect("/onboarding");
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

// F-20: the second login step. Consumes the tf_2fa pending token, verifies a
// TOTP code or a single-use recovery code, and only then creates the session.
export async function verify2fa(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const t = msgs();
  const pending = await readPending2fa();
  if (!pending)
    redirect("/login?error=" + encodeURIComponent("Your sign-in expired. Please log in again."));

  const code = String(formData.get("code") ?? "");
  const user = await db.user.findUnique({ where: { id: pending!.userId } });
  if (!user || !user.totpEnabledAt || !user.totpSecretEnc) {
    clearPending2fa();
    redirect("/login");
  }

  // Wrong codes draw down the same per-email lockout budget as wrong passwords.
  if (isLockedOut(user!.email)) return { error: t.lockedOut };

  const okTotp = verifyTotp(decrypt(user!.totpSecretEnc!), code);
  let usedRecovery = false;
  if (!okTotp) {
    const rec = await db.twoFactorRecoveryCode.findFirst({
      where: {
        userId: user!.id,
        codeHash: sha256Hex(normalizeRecoveryCode(code)),
        usedAt: null,
      },
    });
    if (rec) {
      await db.twoFactorRecoveryCode.update({
        where: { id: rec.id },
        data: { usedAt: new Date() },
      });
      usedRecovery = true;
    }
  }

  if (!okTotp && !usedRecovery) {
    recordFailure(user!.email);
    return { error: "That code is not valid. Try again, or use a recovery code." };
  }

  failedAttempts.delete(user!.email);
  clearPending2fa();
  await logAudit({
    userId: user!.id,
    action: usedRecovery ? "auth.2fa_recovery_used" : "auth.login",
    detail: usedRecovery ? undefined : "password+totp",
  });
  await createSession(user!, pending!.rememberMe);
  if (!user!.onboardedAt) redirect("/onboarding");
  redirect(pending!.next && pending!.next.startsWith("/") ? pending!.next : "/dashboard");
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
  if (passwordLoginDisabled()) return { error: PASSWORD_LOGIN_DISABLED_MSG };
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
  if (passwordLoginDisabled()) return { error: PASSWORD_LOGIN_DISABLED_MSG };
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
