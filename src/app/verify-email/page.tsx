import Link from "next/link";
import { ResendVerification } from "@/components/ResendVerification";

// PRD §12.3 langkah 4: halaman instruksi cek inbox + tombol resend
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-slate-900">
          ⚒️ Test<span className="text-indigo-600">Forge</span>
        </Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-3xl">
            📬
          </div>
          <h1 className="mt-4 text-xl font-bold">Cek inbox kamu</h1>
          <p className="mt-2 text-sm text-slate-500">
            Kami mengirim link verifikasi ke{" "}
            <span className="font-medium text-slate-700">{email || "email kamu"}</span>.
            Klik link tersebut untuk mengaktifkan akun. Link berlaku 24 jam.
          </p>
          <ResendVerification email={email} />
          <p className="mt-6 text-xs text-slate-400">
            Salah alamat email?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Daftar ulang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
