"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProject } from "@/app/actions/projects";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="project-create-submit"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Creating..." : "+ Create Project"}
    </button>
  );
}

export function NewProjectForm() {
  const [state, formAction] = useFormState(createProject, undefined);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-hairline bg-surface p-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Project Name
          </label>
          <input
            name="name"
            required
            data-testid="project-name-input"
            placeholder="e.g. Web Portal"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Slug (for ID: TC-SLUG-001)
          </label>
          <input
            name="slug"
            placeholder="web"
            pattern="[a-z0-9-]*"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs font-medium text-content-muted">
            Description (optional)
          </label>
          <input
            name="description"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
        </div>
        <SubmitButton />
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
