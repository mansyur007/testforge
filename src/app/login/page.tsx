"use client";

import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/OAuthButtons";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Memproses..." : "Log In"}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(login, undefined);
  const params = useSearchParams();
  const oauthError = params.get("error");
  const verified = params.get("verified");
  const reset = params.get("reset");
  const next = params.get("next") ?? "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <OAuthButtons mode="login" />
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        atau dengan email
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {verified && (
          <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            ✅ Email terverifikasi! Silakan login.
          </p>
        )}
        {reset && (
          <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            ✅ Password berhasil direset. Silakan login.
          </p>
        )}
        {(state?.error || oauthError) && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {state?.error ?? oauthError}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="anda@perusahaan.com"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="rememberMe" />
          Remember me <span className="text-xs text-slate-400">(30 hari)</span>
        </label>
        <SubmitButton />
        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            Daftar gratis
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-3xl font-bold text-slate-900">
            ⚒️ Test<span className="text-indigo-600">Forge</span>
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Open Source Test Case Management Platform
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@testforge.local / admin12345
        </p>
      </div>
    </main>
  );
}
