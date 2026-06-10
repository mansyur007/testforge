import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";
import { OAuthButtons } from "@/components/OAuthButtons";

export const metadata: Metadata = {
  title: "Daftar Gratis — TestForge",
  description:
    "Buat akun TestForge gratis. Tanpa kartu kredit, unlimited users dan projects.",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-3xl font-bold text-slate-900">
            ⚒️ Test<span className="text-indigo-600">Forge</span>
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Mulai dalam 60 detik. Gratis selamanya — tanpa kartu kredit.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <OAuthButtons mode="signup" />
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            atau dengan email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <SignupForm />
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
