"use client";

import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormInner({ lang }: { lang: Lang }) {
  const t = dict[lang].auth.login;
  const [state, formAction] = useFormState(login, undefined);
  const params = useSearchParams();
  const oauthError = params.get("error");
  const verified = params.get("verified");
  const reset = params.get("reset");
  const next = params.get("next") ?? "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {verified && (
          <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            {t.verified}
          </p>
        )}
        {reset && (
          <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            {t.reset}
          </p>
        )}
        {(state?.error || oauthError) && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {state?.error ?? oauthError}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.email}
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              {t.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:underline"
            >
              {t.forgot}
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
          {t.remember} <span className="text-xs text-slate-400">{t.rememberHint}</span>
        </label>
        <SubmitButton label={t.submit} pendingLabel={t.submitting} />
        <p className="text-center text-sm text-slate-500">
          {t.noAccount}{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            {t.signupLink}
          </Link>
        </p>
      </form>
    </div>
  );
}

export function LoginForm({ lang }: { lang: Lang }) {
  return (
    <Suspense>
      <FormInner lang={lang} />
    </Suspense>
  );
}
