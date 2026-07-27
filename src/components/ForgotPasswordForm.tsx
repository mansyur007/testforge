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
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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
      className="space-y-4 rounded-xl border border-hairline bg-surface p-8 shadow-sm"
    >
      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success-soft-fg">
          {state.ok}
        </p>
      )}
      {state?.devLink && (
        <div className="rounded-lg bg-warning-soft p-3 text-xs text-warning-soft-fg">
          <p className="font-medium">{t.devMode}</p>
          <a href={state.devLink} className="break-all underline">
            {state.devLink}
          </a>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          {t.email}
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
      </div>
      <SubmitButton label={t.submit} pendingLabel={t.submitting} />
      <p className="flex justify-center text-sm text-content-muted">
        <BackLink href="/login" className="font-medium">{t.back}</BackLink>
      </p>
    </form>
  );
}
