"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { addDependency, removeDependency } from "@/app/actions/case-dependencies";

// F-32: a case's prerequisites (what it must pass first) and dependents
// (what depends on it). Adding a prerequisite is the only write path here —
// the server rejects a self-dependency or anything that would create a
// cycle, surfaced as a real error (never silent).

export type DependencyCaseOption = { id: string; displayId: string; title: string };

function AddSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="dependency-add-submit"
      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
    >
      {pending ? "Adding…" : "+ Add"}
    </button>
  );
}

export function CaseDependencies({
  projectSlug,
  caseId,
  prerequisites,
  dependents,
  candidates,
  canWrite,
}: {
  projectSlug: string;
  caseId: string;
  prerequisites: { linkId: string; case: DependencyCaseOption }[];
  dependents: { linkId: string; case: DependencyCaseOption }[];
  candidates: DependencyCaseOption[];
  canWrite: boolean;
}) {
  const [state, formAction] = useFormState(addDependency, undefined);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">
          Depends on ({prerequisites.length})
        </h4>
        <ul className="space-y-1.5 text-sm" data-testid="dependency-prerequisites">
          {prerequisites.map((p) => (
            <li key={p.linkId} className="flex items-center justify-between gap-2">
              <Link
                href={`/projects/${projectSlug}/cases/${p.case.id}`}
                className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
              >
                <span className="font-mono text-xs text-slate-400">{p.case.displayId}</span>{" "}
                {p.case.title}
              </Link>
              {canWrite && (
                <form action={removeDependency}>
                  <input type="hidden" name="linkId" value={p.linkId} />
                  <button
                    className="shrink-0 text-xs text-slate-400 hover:text-red-600"
                    title="Remove"
                    data-testid={`dependency-remove-${p.linkId}`}
                  >
                    ✕
                  </button>
                </form>
              )}
            </li>
          ))}
          {prerequisites.length === 0 && (
            <li className="text-xs text-slate-400">No prerequisites.</li>
          )}
        </ul>

        {canWrite && candidates.length > 0 && (
          <form action={formAction} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="caseId" value={caseId} />
            <select
              name="dependsOnCaseId"
              data-testid="dependency-add-select"
              className="min-w-48 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayId} — {c.title}
                </option>
              ))}
            </select>
            <AddSubmit />
          </form>
        )}
        {state?.error && (
          <p data-testid="dependency-add-error" className="mt-1 text-xs text-red-600">
            {state.error}
          </p>
        )}
      </div>

      {dependents.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">
            Required by ({dependents.length})
          </h4>
          <ul className="space-y-1.5 text-sm" data-testid="dependency-dependents">
            {dependents.map((d) => (
              <li key={d.linkId}>
                <Link
                  href={`/projects/${projectSlug}/cases/${d.case.id}`}
                  className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
                >
                  <span className="font-mono text-xs text-slate-400">{d.case.displayId}</span>{" "}
                  {d.case.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
