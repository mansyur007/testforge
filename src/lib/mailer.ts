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

/**
 * Bungkus konten dalam template email transaksional yang branded.
 * Memakai layout berbasis <table> + inline CSS agar tampil konsisten di
 * Gmail, Outlook, Apple Mail, dan klien email lain (yang sering mengabaikan
 * <style>, flexbox, dan margin).
 */
export function actionEmailHtml(opts: {
  heading: string;
  body: string;
  buttonLabel: string;
  actionUrl: string;
}) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <tr>
            <td style="background:#4f46e5;padding:24px 32px;">
              <span style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">TestForge</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a;">${opts.heading}</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#475569;">${opts.body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="#4f46e5" style="border-radius:10px;">
                    <a href="${opts.actionUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${opts.buttonLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#94a3b8;">Jika tombol tidak berfungsi, salin URL ini ke browser:</p>
              <a href="${opts.actionUrl}" target="_blank" style="font-size:12px;color:#4f46e5;word-break:break-all;text-decoration:none;">${opts.actionUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding:20px 32px;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">Email ini dikirim otomatis oleh TestForge. Jika kamu tidak meminta tindakan ini, abaikan saja email ini.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">&copy; ${year} TestForge</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
