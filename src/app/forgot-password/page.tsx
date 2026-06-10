"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { forgotPassword } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Mengirim..." : "Kirim Link Reset"}
    </button>
  );
}

// AU-008: forgot password via email reset link, valid 1 jam
export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPassword, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-3xl font-bold text-slate-900">
            ⚒️ Test<span className="text-indigo-600">Forge</span>
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Masukkan email kamu — kami kirim link reset password (berlaku 1 jam).
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
          {state?.ok && (
            <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
              {state.ok}
            </p>
          )}
          {state?.devLink && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-medium">Mode dev (SMTP belum dikonfigurasi):</p>
              <a href={state.devLink} className="break-all underline">
                {state.devLink}
              </a>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="anda@perusahaan.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <SubmitButton />
          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              ← Kembali ke login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
