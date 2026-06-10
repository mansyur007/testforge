import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

// PRD §12.3 langkah 5: user klik link di email → token divalidasi → akun aktif
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) redirect("/login");

  const result = await verifyEmailToken(token);
  if (result.ok && result.next) redirect(result.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-slate-900">
          ⚒️ Test<span className="text-indigo-600">Forge</span>
        </Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>
          <h1 className="mt-4 text-xl font-bold">Verifikasi gagal</h1>
          <p className="mt-2 text-sm text-slate-500">{result.error}</p>
          <Link
            href="/verify-email"
            className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Minta link baru
          </Link>
        </div>
      </div>
    </main>
  );
}
