"use client";

import { useFormState, useFormStatus } from "react-dom";
import { acceptInvite } from "@/app/actions/invite";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Processing..." : "Accept invitation"}
    </button>
  );
}

export function AcceptInvite({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptInvite, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
