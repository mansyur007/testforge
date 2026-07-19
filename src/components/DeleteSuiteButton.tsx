"use client";

import { useState, useTransition } from "react";
import { deleteSuite } from "@/app/actions/projects";
import { TFIcon } from "@/components/icons";

// Trash control next to a suite in the tree, with an in-app modal (matching the
// bulk-delete style) instead of the browser confirm/alert:
// - suite (or a sub-suite) still has cases → a warning modal, no delete action;
// - empty suite → a Delete / Cancel confirmation modal.
export function DeleteSuiteButton({
  suiteId,
  suiteName,
  caseCount,
}: {
  suiteId: string;
  suiteName: string;
  caseCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blocked = caseCount > 0;

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("suiteId", suiteId);
      const res = await deleteSuite(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        title={`Delete suite "${suiteName}"`}
        aria-label={`Delete suite ${suiteName}`}
        data-testid={`suite-delete-${suiteId}`}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="ml-1 shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
      >
        <TFIcon name="delete" className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 motion-safe:animate-tf-fade-in">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl motion-safe:animate-tf-pop-in">
            {blocked ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  Can&apos;t delete &ldquo;{suiteName}&rdquo;
                </h3>
                <p className="text-sm text-slate-500">
                  It has {caseCount} test case{caseCount === 1 ? "" : "s"} (here
                  or in a sub-suite). Move them to another suite or delete them
                  first.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    data-testid="suite-delete-ok"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    OK
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete suite &ldquo;{suiteName}&rdquo;?
                </h3>
                <p className="text-sm text-slate-500">
                  This also removes its sub-suites. This can&apos;t be undone.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={pending}
                    data-testid="suite-delete-confirm"
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
