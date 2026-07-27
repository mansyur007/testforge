"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePassword } from "@/app/actions/account";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

// mode "change": akun email/password — wajib password lama.
// mode "set": akun OAuth yang belum punya password.
export function ChangePasswordForm({ mode }: { mode: "change" | "set" }) {
  const [state, formAction] = useFormState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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

      {mode === "change" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-content">
            Current password
          </label>
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="bg-surface text-content-strong w-full max-w-sm rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          New password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="bg-surface text-content-strong w-full max-w-sm rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <p className="mt-1 text-xs text-content-subtle">
          At least 8 characters, with 1 uppercase letter and 1 number.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          Confirm new password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="bg-surface text-content-strong w-full max-w-sm rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
      </div>

      <SubmitButton label={mode === "change" ? "Change password" : "Set password"} />
    </form>
  );
}
