import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self-Hosting — TestForge",
  description: "Deploy TestForge di server sendiri dengan satu perintah Docker Compose.",
};

// HP-003: target CTA "Self-Host in 5 Minutes"
export default function SelfHostingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Kembali ke beranda
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Self-Host in 5 Minutes</h1>
      <p className="mt-3 text-slate-600">
        TestForge berjalan di infrastruktur kamu sendiri — data 100% milik kamu.
        Kebutuhan minimum: Docker dan 2GB RAM (PRD §5.4).
      </p>

      <h2 className="mt-10 text-xl font-semibold">1. Docker Compose (rekomendasi)</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
{`git clone https://github.com/testforge/testforge.git
cd testforge
docker compose up -d`}
      </pre>
      <p className="mt-2 text-sm text-slate-500">
        Aplikasi tersedia di <code className="rounded bg-slate-100 px-1">http://localhost:3000</code>.
        Akun pertama yang mendaftar otomatis menjadi Admin.
      </p>

      <h2 className="mt-10 text-xl font-semibold">2. Konfigurasi environment</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
{`AUTH_SECRET=secret-acak-yang-panjang     # wajib diganti di production
DATABASE_URL=file:/data/testforge.db      # atau postgresql://... untuk Postgres
NEXT_PUBLIC_BASE_URL=https://testforge.perusahaan.com
SMTP_URL=smtp://user:pass@mail:587        # opsional, untuk email verifikasi
GOOGLE_CLIENT_ID=...                      # opsional, untuk OAuth Google
GITHUB_CLIENT_ID=...                      # opsional, untuk OAuth GitHub`}
      </pre>

      <h2 className="mt-10 text-xl font-semibold">3. VPS / Bare metal</h2>
      <p className="mt-2 text-sm text-slate-600">
        Ubuntu 20.04+ dengan 2GB RAM cukup. Pasang Docker, jalankan compose, dan
        arahkan reverse proxy (Nginx/Caddy) ke port 3000 dengan SSL.
      </p>

      <div className="mt-10 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
        <p className="font-medium">Lebih suka tanpa setup?</p>
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Start for Free di Cloud
        </Link>
      </div>
    </main>
  );
}
