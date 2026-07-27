"use client";

import { useFormState, useFormStatus } from "react-dom";
import { convertNoteToIssue } from "@/app/actions/sessions";

// F-25: files a BUG note as an issue on the project's configured tracker
// (F-07). Only rendered when an active integration exists — mirrors
// IssuePanel's "stay out of the way" rule.

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="session-note-convert-issue"
      className="rounded-lg border border-danger-border px-2.5 py-1 text-xs font-medium text-danger-soft-fg hover:bg-danger-soft disabled:opacity-50"
    >
      {pending ? "Filing…" : "File as issue"}
    </button>
  );
}

export function ConvertToIssueButton({ noteId }: { noteId: string }) {
  const [state, formAction] = useFormState(convertNoteToIssue, undefined);
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="noteId" value={noteId} />
      <Submit />
      {state?.error && (
        <p data-testid="session-note-convert-issue-error" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
