"use client";

import { useFormState, useFormStatus } from "react-dom";
import { superadminLogin } from "@/app/actions/superadmin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="superadmin-submit"
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function SuperadminLoginForm() {
  const [state, formAction] = useFormState(superadminLogin, undefined);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-hairline bg-surface p-8 shadow-sm"
    >
      {state?.error && (
        <p
          data-testid="superadmin-error"
          className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg"
        >
          {state.error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          Username
        </label>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          data-testid="superadmin-username"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-content-strong focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-content">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          data-testid="superadmin-password"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-content-strong focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
