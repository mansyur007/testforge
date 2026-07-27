"use client";

import { useMemo, useState } from "react";
import { PRIORITIES, CASE_TYPES, PRIORITY_BADGES } from "@/lib/constants";

// F-06: the case picker extracted verbatim from NewRunForm so run creation and
// plan creation share one implementation. Controlled: the parent owns the
// selection set (and renders the hidden caseIds inputs for its form).

export type SelectableCase = {
  id: string;
  displayId: string;
  title: string;
  priority: string;
  type: string;
  tags: string;
  suiteName: string;
  status?: string; // F-15: used to warn about not-yet-approved cases in a run
};

export function CaseSelector({
  cases,
  selected,
  onChange,
}: {
  cases: SelectableCase[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [fPriority, setFPriority] = useState("");
  const [fType, setFType] = useState("");
  const [fTag, setFTag] = useState("");
  const [fQ, setFQ] = useState("");

  const filtered = useMemo(
    () =>
      cases.filter(
        (c) =>
          (!fPriority || c.priority === fPriority) &&
          (!fType || c.type === fType) &&
          (!fTag || c.tags.toLowerCase().includes(fTag.toLowerCase())) &&
          (!fQ || c.title.toLowerCase().includes(fQ.toLowerCase()))
      ),
    [cases, fPriority, fType, fTag, fQ]
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selected);
    filtered.forEach((c) => next.add(c.id));
    onChange(next);
  };

  const unselectAllFiltered = () => {
    const next = new Set(selected);
    filtered.forEach((c) => next.delete(c.id));
    onChange(next);
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={fQ}
          onChange={(e) => setFQ(e.target.value)}
          placeholder="Search title..."
          className="w-44 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}
          className="rounded-lg border border-hairline-strong px-2 py-1.5 text-sm">
          <option value="">Priority</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value)}
          className="rounded-lg border border-hairline-strong px-2 py-1.5 text-sm">
          <option value="">Type</option>
          {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input
          value={fTag}
          onChange={(e) => setFTag(e.target.value)}
          placeholder="Tag..."
          className="w-28 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <button type="button" onClick={selectAllFiltered}
          className="rounded-lg border border-accent-ring px-3 py-1.5 text-sm text-accent-text hover:bg-accent-soft">
          Select all ({filtered.length})
        </button>
        <button type="button" onClick={unselectAllFiltered}
          className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-content hover:bg-canvas">
          Unselect all
        </button>
        <button type="button" onClick={() => onChange(new Set())}
          className="rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-content-muted hover:bg-canvas">
          Reset
        </button>
      </div>
      <div className="max-h-96 divide-y divide-hairline-subtle overflow-y-auto rounded-lg border border-hairline">
        {filtered.length > 0 && (
          <label className="flex cursor-pointer items-center gap-3 bg-canvas px-3 py-2 text-sm font-medium text-content hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={() =>
                allFilteredSelected ? unselectAllFiltered() : selectAllFiltered()
              }
            />
            <span>{allFilteredSelected ? "Unselect all" : "Select all"}</span>
          </label>
        )}
        {filtered.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-canvas"
          >
            <input
              type="checkbox"
              checked={selected.has(c.id)}
              onChange={() => toggle(c.id)}
            />
            <span className="font-mono text-xs text-content-subtle">{c.displayId}</span>
            <span className="flex-1">{c.title}</span>
            <span className="text-xs text-content-subtle">{c.suiteName}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}>
              {c.priority}
            </span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-content-subtle">
            No test cases match the filter.
          </p>
        )}
      </div>
    </div>
  );
}
