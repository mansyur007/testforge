// Pengiriman email transaksional (verifikasi, reset password, undangan tim).
// Memakai SMTP_URL via nodemailer. Tanpa SMTP_URL (atau bila pengiriman gagal),
// fungsi mengembalikan sent:false agar pemanggil bisa fallback ke dev-link/log
// — sehingga app tetap berfungsi meski SMTP belum dikonfigurasi.

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Bungkus konten dalam template HTML sederhana dengan tombol aksi. */
export function actionEmailHtml(opts: {
  heading: string;
  body: string;
  buttonLabel: string;
  actionUrl: string;
}) {
  return `<!doctype html>
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
  <h1 style="font-size:20px;margin:0 0 12px">${opts.heading}</h1>
  <p style="font-size:14px;color:#475569;margin:0 0 24px">${opts.body}</p>
  <a href="${opts.actionUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px">
    ${opts.buttonLabel}
  </a>
  <p style="font-size:12px;color:#94a3b8;margin:24px 0 0">
    Jika tombol tidak berfungsi, salin URL ini ke browser:<br>
    <a href="${opts.actionUrl}" style="color:#4f46e5;word-break:break-all">${opts.actionUrl}</a>
  </p>
</div>`;
}

export async function sendMail(
  args: SendArgs
): Promise<{ sent: boolean; error?: string }> {
  if (!process.env.SMTP_URL) {
    console.log(`[mail:dev] to=${args.to} subject="${args.subject}"`);
    return { sent: false };
  }
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport(process.env.SMTP_URL);
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "TestForge <no-reply@testforge.local>",
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mail] gagal kirim ke ${args.to}:`, err);
    return { sent: false, error: (err as Error).message };
  }
}
