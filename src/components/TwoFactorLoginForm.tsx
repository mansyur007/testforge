"use client";

import { useFormState, useFormStatus } from "react-dom";
import { verify2fa } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="verify-2fa-submit"
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Verifying…" : "Verify"}
    </button>
  );
}

export function TwoFactorLoginForm() {
  const [state, formAction] = useFormState(verify2fa, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Authentication code
        </label>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          data-testid="verify-2fa-code"
          placeholder="123456"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          Enter the 6-digit code from your authenticator app, or a recovery code.
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}
