"use client";

import { useFormState, useFormStatus } from "react-dom";
import { forgotPassword } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";
import { BackLink } from "@/components/icons";

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

// AU-008: forgot password via email reset link, valid 1 jam
export function ForgotPasswordForm({ lang }: { lang: Lang }) {
  const t = dict[lang].auth.forgot;
  const [state, formAction] = useFormState(forgotPassword, undefined);

  return (
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
          <p className="font-medium">{t.devMode}</p>
          <a href={state.devLink} className="break-all underline">
            {state.devLink}
          </a>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t.email}
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <SubmitButton label={t.submit} pendingLabel={t.submitting} />
      <p className="flex justify-center text-sm text-slate-500">
        <BackLink href="/login" className="font-medium">{t.back}</BackLink>
      </p>
    </form>
  );
}
