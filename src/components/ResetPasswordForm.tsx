"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "@/app/actions/auth";
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
  const t = dict[lang].auth.reset;
  const token = useSearchParams().get("token") ?? "";
  const [state, formAction] = useFormState(resetPassword, undefined);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.newPassword}{" "}
          <span className="text-slate-400">{t.passwordHint}</span>
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.confirm}
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <SubmitButton label={t.submit} pendingLabel={t.submitting} />
    </form>
  );
}

export function ResetPasswordForm({ lang }: { lang: Lang }) {
  return (
    <Suspense>
      <FormInner lang={lang} />
    </Suspense>
  );
}
