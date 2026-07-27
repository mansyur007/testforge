"use client";

import { deleteCase } from "@/app/actions/cases";
import { TFIcon } from "@/components/icons";

// Simple yes/cancel guard before the (soft) delete fires. Cancelling prevents
// the server action from submitting.
export function DeleteCaseButton({ caseId }: { caseId: string }) {
  return (
    <form
      action={deleteCase}
      onSubmit={(e) => {
        if (!confirm("Delete this test case?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="caseId" value={caseId} />
      <button data-testid="case-delete" className="inline-flex items-center gap-1.5 rounded-lg border border-danger-border px-3 py-1.5 text-sm text-danger hover:bg-danger-soft">
        <TFIcon name="delete" current className="h-4 w-4" /> Delete
      </button>
    </form>
  );
}
