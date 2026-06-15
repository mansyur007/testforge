"use client";

import { useRef, useState } from "react";
import { bulkUpdateCases } from "@/app/actions/cases";
import { PRIORITIES, CASE_TYPES, CASE_STATUSES } from "@/lib/constants";

// Bulk edit (PRD §4.2.2): pilih banyak case, update priority/type/status sekaligus.
export function BulkEditBar({
  projectSlug,
  children,
}: {
  projectSlug: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [field, setField] = useState("priority");

  const options =
    field === "priority"
      ? PRIORITIES
      : field === "type"
        ? CASE_TYPES
        : CASE_STATUSES;

  return (
    <form
      ref={formRef}
      action={bulkUpdateCases}
      onChange={() => {
        const checked =
          formRef.current?.querySelectorAll('input[name="caseIds"]:checked')
            .length ?? 0;
        setSelectedCount(checked);
      }}
    >
      <input type="hidden" name="projectSlug" value={projectSlug} />
      {selectedCount > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm">
          <span className="font-medium text-indigo-700">
            {selectedCount} selected
          </span>
          <span className="text-slate-400">|</span>
          <span>Change</span>
          <select
            name="bulkField"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="priority">Priority</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
          <span>to</span>
          <select
            name="bulkValue"
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            {options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
            Apply
          </button>
        </div>
      )}
      {children}
    </form>
  );
}
