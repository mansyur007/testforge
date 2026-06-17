"use client";

import { useTransition } from "react";
import { deleteSuite } from "@/app/actions/projects";

// Small ✕ next to a suite in the tree. Only empty suites delete; if cases remain
// the server returns a message which we surface via alert().
export function DeleteSuiteButton({
  suiteId,
  suiteName,
}: {
  suiteId: string;
  suiteName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={`Delete suite "${suiteName}"`}
      aria-label={`Delete suite ${suiteName}`}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Delete suite "${suiteName}"? This also removes its sub-suites. Only works if it has no test cases.`
          )
        )
          return;
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
