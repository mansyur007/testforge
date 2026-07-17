"use client";

import { useState } from "react";
import Link from "next/link";
import { linkDefectToEntity, createAndLinkDefect, unlinkDefect } from "@/app/actions/defects";

// F-26: built-in defects linked to a case or run result — badges, "Link
// existing" (picker over the project's open defects), and "Report new".
// Complements F-07's IssuePanel; always visible (no external config needed).

export type DefectLinkView = {
  id: string;
  defectId: string;
  displayId: string;
  title: string;
  status: string;
};

export type ProjectDefectOption = { id: string; displayId: string; title: string };

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  FIXED: "bg-green-100 text-green-800",
  WONT_FIX: "bg-slate-100 text-slate-500",
  CLOSED: "bg-gray-100 text-gray-500",
};

export function DefectPanel({
  projectSlug,
  entityType,
  entityId,
  links,
  canWrite,
  projectDefects,
}: {
  projectSlug: string;
  entityType: "CASE" | "RESULT";
  entityId: string;
  links: DefectLinkView[];
  canWrite: boolean;
  projectDefects: ProjectDefectOption[];
}) {
  const [mode, setMode] = useState<"idle" | "link" | "new">("idle");

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="defect-badges">
          {links.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1">
              <Link
                href={`/projects/${projectSlug}/defects/${l.defectId}`}
                data-testid={`defect-badge-${l.displayId}`}
                className={`rounded-full px-2 py-0.5 text-xs font-medium hover:underline ${STATUS_BADGE[l.status] ?? STATUS_BADGE.OPEN}`}
              >
                🐛 {l.displayId} · {l.status.replace(/_/g, " ")}
              </Link>
              {canWrite && (
                <form action={unlinkDefect}>
                  <input type="hidden" name="linkId" value={l.id} />
                  <button
                    type="submit"
                    title="Unlink"
                    className="text-xs text-slate-300 hover:text-red-600"
                  >
                    ✕
                  </button>
                </form>
              )}
            </span>
          ))}
        </div>
      )}

      {canWrite && (
        <div className="space-y-2">
          {mode === "idle" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("link")}
                data-testid="defect-link-open"
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
              >
                Link defect
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                data-testid="defect-new-open"
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
              >
                Report defect
              </button>
            </div>
          )}

          {mode === "link" && (
            <form
              action={linkDefectToEntity}
              className="flex items-center gap-2"
              onSubmit={() => setMode("idle")}
            >
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <select
                name="defectId"
                required
                data-testid="defect-link-select"
                className="min-w-48 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              >
                {projectDefects
                  .filter((d) => !links.some((l) => l.defectId === d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayId} — {d.title}
                    </option>
                  ))}
              </select>
              <button
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-white hover:bg-slate-700"
                data-testid="defect-link-submit"
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </form>
          )}

          {mode === "new" && (
            <form
              action={createAndLinkDefect}
              className="space-y-1.5"
              onSubmit={() => setMode("idle")}
            >
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <input
                name="title"
                required
                placeholder="Defect title"
                data-testid="defect-new-title"
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              />
              <div className="flex items-center gap-2">
                <select
                  name="severity"
                  defaultValue="MEDIUM"
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <button
                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                  data-testid="defect-new-submit"
                >
                  Report
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
