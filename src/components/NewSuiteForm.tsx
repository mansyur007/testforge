"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createSuite } from "@/app/actions/projects";

// Keep the server action as the form action (so the POST actually fires &
// progressive enhancement works), and reset the inputs once it reports success
// — React 18 doesn't auto-clear uncontrolled fields after a server action.
export function NewSuiteForm({
  projectId,
  rootSuites,
}: {
  projectId: string;
  rootSuites: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(createSuite, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 space-y-2 border-t border-slate-100 pt-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="name"
        placeholder="New suite name..."
        required
        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
      />
      <select
        name="parentId"
        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
      >
        <option value="">(root suite)</option>
        {rootSuites.map((s) => (
          <option key={s.id} value={s.id}>
            section in: {s.name}
          </option>
        ))}
      </select>
      <button className="w-full rounded bg-slate-800 px-2 py-1.5 text-xs text-white hover:bg-slate-700">
        + Add Suite
      </button>
    </form>
  );
}
