import Link from "next/link";

export const metadata = { title: "Terms of Service — TestForge" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Kembali ke beranda
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          TestForge adalah perangkat lunak open source berlisensi MIT. Dengan
          menggunakan layanan ini, kamu setuju bahwa perangkat lunak disediakan
          &ldquo;sebagaimana adanya&rdquo; tanpa jaminan apa pun.
        </p>
        <p>
          Kamu bertanggung jawab atas data yang kamu simpan dan keamanan
          kredensial akun kamu. Jangan gunakan layanan untuk aktivitas ilegal.
        </p>
        <p className="text-slate-400">
          Dokumen ini adalah placeholder MVP — lengkapi dengan review legal
          sebelum peluncuran publik.
        </p>
      </div>
    </main>
  );
}
