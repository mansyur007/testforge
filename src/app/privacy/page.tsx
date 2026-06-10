import Link from "next/link";

export const metadata = { title: "Privacy Policy — TestForge" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Kembali ke beranda
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          Data akun (nama, email) hanya dipakai untuk autentikasi dan
          kolaborasi tim. Password di-hash dengan bcrypt dan tidak pernah
          disimpan dalam bentuk plaintext.
        </p>
        <p>
          Pada deployment self-hosted, seluruh data berada di server kamu
          sendiri — tidak ada data yang dikirim ke pihak ketiga. Telemetry
          bersifat opt-in dan anonim.
        </p>
        <p className="text-slate-400">
          Dokumen ini adalah placeholder MVP — lengkapi dengan review legal
          sebelum peluncuran publik.
        </p>
      </div>
    </main>
  );
}
