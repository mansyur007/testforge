"use client";

import { useFormState, useFormStatus } from "react-dom";
import { acceptInvite } from "@/app/actions/invite";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Memproses..." : "Terima undangan"}
    </button>
  );
}

export function AcceptInvite({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptInvite, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
