"use server";

import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";
import { generateSecret, verifyTotp, otpauthUri } from "@/lib/totp";
import { sha256Hex, normalizeRecoveryCode, makeRecoveryCodes } from "@/lib/two-factor";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// F-20: two-factor (TOTP) enrollment & management. Enrollment is two-phase —
// startTotpEnroll stores the encrypted secret with totpEnabledAt still NULL, and
// only confirmTotpEnroll (after the user proves a live code) flips it on and mints
// recovery codes. The raw secret and raw recovery codes never leave these actions
// except in the one response that shows them to the enrolling user.

/**
 * Phase 1: generate a secret and return the QR + secret for the user to scan.
 * Overwrites any half-finished enrollment (totpEnabledAt still NULL). Refuses if
 * 2FA is already fully enabled — the user must disable first.
 */
export async function startTotpEnroll(): Promise<
  { ok: true; qrDataUrl: string; secret: string } | { ok: false; error: string }
> {
  const session = await requireSession();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { email: true, totpEnabledAt: true },
  });
  if (user.totpEnabledAt)
    return { ok: false, error: "Two-factor authentication is already enabled." };

  const secret = generateSecret();
  await db.user.update({
    where: { id: session.userId },
    data: { totpSecretEnc: encrypt(secret), totpEnabledAt: null },
  });
  const uri = otpauthUri(user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 200 });
  return { ok: true, qrDataUrl, secret };
}

/**
 * Phase 2: verify a code against the pending secret; on success enable 2FA and
 * return the one-time recovery codes.
 */
export async function confirmTotpEnroll(
  _prev: { error?: string; codes?: string[] } | undefined,
  formData: FormData
): Promise<{ error?: string; codes?: string[] }> {
  const session = await requireSession();
  const code = String(formData.get("code") ?? "");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { totpSecretEnc: true, totpEnabledAt: true },
  });
  if (user.totpEnabledAt) return { error: "Two-factor is already enabled." };
  if (!user.totpSecretEnc)
    return { error: "Start enrollment again — no pending secret was found." };

  const secret = decrypt(user.totpSecretEnc);
  if (!verifyTotp(secret, code))
    return { error: "That code is not valid. Check your authenticator and try again." };

  const { raw, hashes } = makeRecoveryCodes();
  await db.$transaction([
    db.user.update({
      where: { id: session.userId },
      data: { totpEnabledAt: new Date() },
    }),
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: session.userId } }),
    db.twoFactorRecoveryCode.createMany({
      data: hashes.map((codeHash) => ({ userId: session.userId, codeHash })),
    }),
  ]);
  await logAudit({ userId: session.userId, action: "auth.2fa_enable" });
  // NOTE: intentionally NO revalidatePath here. Revalidating would re-render the
  // account page with enabled=true, unmounting this enrollment view before the
  // user can copy their one-time recovery codes. The page reflects the enabled
  // state on the next navigation, which is exactly when the codes screen is done.
  return { codes: raw };
}

/**
 * Disable 2FA. Requires a currently valid TOTP code OR an unused recovery code —
 * so a walk-up attacker with a live session still can't silently strip MFA.
 */
export async function disableTotp(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const code = String(formData.get("code") ?? "");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { totpSecretEnc: true, totpEnabledAt: true },
  });
  if (!user.totpEnabledAt || !user.totpSecretEnc)
    return { error: "Two-factor is not enabled." };

  const okTotp = verifyTotp(decrypt(user.totpSecretEnc), code);
  const okRecovery = okTotp
    ? false
    : !!(await db.twoFactorRecoveryCode.findFirst({
        where: {
          userId: session.userId,
          codeHash: sha256Hex(normalizeRecoveryCode(code)),
          usedAt: null,
        },
      }));
  if (!okTotp && !okRecovery)
    return { error: "Enter a valid authenticator code or recovery code to disable." };

  await db.$transaction([
    db.user.update({
      where: { id: session.userId },
      data: { totpSecretEnc: null, totpEnabledAt: null },
    }),
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: session.userId } }),
  ]);
  await logAudit({ userId: session.userId, action: "auth.2fa_disable" });
  revalidatePath("/settings/account");
  return {};
}

/**
 * Regenerate the recovery-code set (requires a live TOTP code). Invalidates all
 * previous codes. Returns the new raw codes once.
 */
export async function regenerateRecoveryCodes(
  _prev: { error?: string; codes?: string[] } | undefined,
  formData: FormData
): Promise<{ error?: string; codes?: string[] }> {
  const session = await requireSession();
  const code = String(formData.get("code") ?? "");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { totpSecretEnc: true, totpEnabledAt: true },
  });
  if (!user.totpEnabledAt || !user.totpSecretEnc)
    return { error: "Two-factor is not enabled." };
  if (!verifyTotp(decrypt(user.totpSecretEnc), code))
    return { error: "Enter a valid authenticator code to regenerate." };

  const { raw, hashes } = makeRecoveryCodes();
  await db.$transaction([
    db.twoFactorRecoveryCode.deleteMany({ where: { userId: session.userId } }),
    db.twoFactorRecoveryCode.createMany({
      data: hashes.map((codeHash) => ({ userId: session.userId, codeHash })),
    }),
  ]);
  await logAudit({ userId: session.userId, action: "auth.2fa_recovery_regenerate" });
  return { codes: raw };
}
