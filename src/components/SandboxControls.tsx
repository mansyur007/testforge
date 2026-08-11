"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resetSandboxAction } from "@/app/actions/academy";

// A-04: Reset wipes whatever the learner wrote, so it asks once. Deliberately a
// two-step in the button rather than a modal — the point of the sandbox is that
// breaking it is safe, and a modal would make resetting feel weightier than it
// is. One stray click still shouldn't do it, hence the confirm.

function SubmitButton({ confirming }: { confirming: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid={confirming ? "sandbox-reset-confirm" : "sandbox-reset"}
      disabled={pending}
      className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        confirming
          ? "bg-danger text-white hover:opacity-90"
          : "border border-hairline bg-surface text-content hover:bg-surface-muted"
      }`}
    >
      {pending ? "Resetting…" : confirming ? "Yes, wipe it" : "Reset sandbox"}
    </button>
  );
}

export function SandboxReset() {
  const [state, formAction] = useFormState(resetSandboxAction, undefined);
  const [confirming, setConfirming] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirming) {
          e.preventDefault();
          setConfirming(true);
        }
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <SubmitButton confirming={confirming} />
      {confirming && !state?.ok && (
        <span className="text-sm text-content-muted">
          This deletes every suite, case and run you added here.
        </span>
      )}
      {state?.ok && (
        <span data-testid="sandbox-reset-done" className="text-sm text-content-muted">
          Reset — the ShopMini fixture is back.
        </span>
      )}
    </form>
  );
}
