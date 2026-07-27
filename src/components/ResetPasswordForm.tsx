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
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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
      className="space-y-4 rounded-xl border border-hairline bg-surface p-8 shadow-sm"
    >
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {state.error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          {t.newPassword}{" "}
          <span className="text-content-subtle">{t.passwordHint}</span>
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          {t.confirm}
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
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
