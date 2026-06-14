import crypto from "crypto";
import { db } from "./db";
import { sendMail, actionEmailHtml } from "./mailer";

export const TOKEN_TYPES = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  RESET_PASSWORD: "RESET_PASSWORD",
} as const;

const EXPIRY_HOURS: Record<string, number> = {
  VERIFY_EMAIL: 24, // PRD §12.5: 24 jam
  RESET_PASSWORD: 1, // PRD §12.6.2: 1 jam
};

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Buat token baru (menghapus token lama bertipe sama untuk user tsb). */
export async function createToken(userId: string, type: string) {
  const raw = crypto.randomBytes(32).toString("hex");
  await db.verificationToken.deleteMany({ where: { userId, type } });
  await db.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + EXPIRY_HOURS[type] * 60 * 60 * 1000),
    },
  });
  return raw;
}

/** Validasi token; jika valid, tandai terpakai dan kembalikan userId. */
export async function consumeToken(raw: string, type: string) {
  const token = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!token || token.type !== type || token.usedAt) return null;
  if (token.expiresAt < new Date()) return null;
  await db.verificationToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  return token.userId;
}

/** Cek cooldown resend 60 detik (PRD §12.5 / AU-007). */
export async function isResendCoolingDown(userId: string, type: string) {
  const latest = await db.verificationToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
  });
  return latest ? Date.now() - latest.createdAt.getTime() < 60_000 : false;
}

/**
 * Pengiriman email auth (verifikasi / reset password) via SMTP (lihat mailer.ts).
 * Bila SMTP belum dikonfigurasi atau gagal, kembalikan devLink agar bisa
 * ditampilkan di UI / log — app tetap berfungsi tanpa SMTP.
 */
export async function sendAuthEmail(params: {
  to: string;
  subject: string;
  actionUrl: string;
}): Promise<{ sent: boolean; devLink?: string }> {
  const html = actionEmailHtml({
    heading: params.subject,
    body: "Klik tombol di bawah untuk melanjutkan. Link ini hanya berlaku sementara.",
    buttonLabel: "Lanjutkan",
    actionUrl: params.actionUrl,
  });
  const { sent } = await sendMail({
    to: params.to,
    subject: params.subject,
    html,
    text: `${params.subject}\n\n${params.actionUrl}`,
  });
  return sent ? { sent: true } : { sent: false, devLink: params.actionUrl };
}
