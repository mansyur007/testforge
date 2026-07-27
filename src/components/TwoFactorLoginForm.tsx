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
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
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
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">{state.error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
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
          className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <p className="mt-1 text-xs text-content-subtle">
          Enter the 6-digit code from your authenticator app, or a recovery code.
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}
