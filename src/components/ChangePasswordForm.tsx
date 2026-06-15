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
      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {state.ok}
        </p>
      )}

      {mode === "change" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Current password
          </label>
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          New password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-400">
          At least 8 characters, with 1 uppercase letter and 1 number.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <SubmitButton label={mode === "change" ? "Change password" : "Set password"} />
    </form>
  );
}
