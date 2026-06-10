"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { login } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Memproses..." : "Masuk"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            ⚒️ Test<span className="text-indigo-600">Forge</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Open Source Test Case Management Platform
          </p>
        </div>
        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {state.error}
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="anda@perusahaan.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <SubmitButton />
          <p className="text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Daftar
            </Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@testforge.local / admin12345
        </p>
      </div>
    </main>
  );
}
