"use client";

import { useTransition } from "react";
import { muteCase, unmuteCase } from "@/app/actions/cases";

// F-21: quarantine a flaky/known-broken case (reason required) or lift it.
// Both call the server action directly (same pattern as RunExecutor.submit);
// the actions' revalidatePath() refreshes this page's data on completion.

export function MuteButton({ caseId }: { caseId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      data-testid={`mute-button-${caseId}`}
      onClick={() => {
        const reason = window.prompt("Why mute this case? (required)")?.trim();
        if (!reason) return;
        const fd = new FormData();
        fd.set("caseId", caseId);
        fd.set("reason", reason);
        startTransition(async () => {
          await muteCase(fd);
        });
      }}
      className="ml-2 shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-content hover:bg-surface-muted disabled:opacity-50"
    >
      {isPending ? "…" : "Mute"}
    </button>
  );
}

export function UnmuteButton({ caseId }: { caseId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      data-testid={`unmute-button-${caseId}`}
      onClick={() => {
        const fd = new FormData();
        fd.set("caseId", caseId);
        startTransition(async () => {
          await unmuteCase(fd);
        });
      }}
      className="shrink-0 rounded-full bg-sidebar px-2 py-0.5 text-xs font-medium text-white hover:bg-sidebar-hover disabled:opacity-50"
    >
      {isPending ? "…" : "Unmute"}
    </button>
  );
}
