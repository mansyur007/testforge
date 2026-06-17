"use client";

import { useTransition } from "react";
import { deleteSuite } from "@/app/actions/projects";

// Small ✕ next to a suite in the tree.
// - If the suite (or a sub-suite) still has test cases → just warn; don't offer
//   to delete, since it can't be.
// - If empty → a standard yes/cancel confirm, like the other delete actions.
export function DeleteSuiteButton({
  suiteId,
  suiteName,
  caseCount,
}: {
  suiteId: string;
  suiteName: string;
  caseCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={`Delete suite "${suiteName}"`}
      aria-label={`Delete suite ${suiteName}`}
      disabled={pending}
      onClick={() => {
        if (caseCount > 0) {
          alert(
            `Can't delete "${suiteName}": it has ${caseCount} test case${caseCount === 1 ? "" : "s"} (here or in a sub-suite). Move them to another suite or delete them first.`
          );
          return;
        }
        if (!confirm(`Delete suite "${suiteName}"?`)) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("suiteId", suiteId);
          const res = await deleteSuite(fd);
          if (res?.error) alert(res.error);
        });
      }}
      className="ml-1 shrink-0 rounded px-1 text-xs text-slate-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      ✕
    </button>
  );
}
