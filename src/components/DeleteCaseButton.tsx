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
      <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
        <TFIcon name="delete" current className="h-4 w-4" /> Delete
      </button>
    </form>
  );
}
