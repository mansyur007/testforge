"use client";

import { completePlan } from "@/app/actions/plans";

// F-06: closes every active child run, so it gets the same confirm guard as
// other bulk actions.
export function CompletePlanButton({
  planId,
  activeRuns,
}: {
  planId: string;
  activeRuns: number;
}) {
  return (
    <form
      action={completePlan}
      onSubmit={(e) => {
        if (
          !confirm(
            `Complete this plan? ${activeRuns} active run${activeRuns === 1 ? "" : "s"} will be marked complete.`
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="planId" value={planId} />
      <button
        data-testid="plan-complete"
        className="rounded-lg bg-success px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        ✓ Complete Plan
      </button>
    </form>
  );
}
