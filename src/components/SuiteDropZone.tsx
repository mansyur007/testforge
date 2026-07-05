"use client";

import { useState, useTransition } from "react";
import { moveCases } from "@/app/actions/cases";
import { CASE_DND_MIME, CASES_MOVED_EVENT } from "@/lib/dnd";

// Wraps a node in the suite tree (a real suite/sub-suite, or the "All Test
// Cases" root where suiteId is null → unassign) and makes it a drop target for
// cases dragged out of the table. Multi-selection is handled upstream: the drag
// payload is simply a JSON array of case ids.
export function SuiteDropZone({
  projectSlug,
  suiteId,
  className = "",
  children,
}: {
  projectSlug: string;
  suiteId: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const raw = e.dataTransfer.getData(CASE_DND_MIME);
    if (!raw) return;
    let ids: string[];
    try {
      ids = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(ids) || ids.length === 0) return;

    const fd = new FormData();
    fd.set("projectSlug", projectSlug);
    if (suiteId) fd.set("suiteId", suiteId);
    ids.forEach((id) => fd.append("caseIds", id));
    startTransition(async () => {
      await moveCases(fd);
      window.dispatchEvent(new Event(CASES_MOVED_EVENT));
    });
  }

  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(CASE_DND_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`${className} rounded transition-colors ${
        over ? "ring-2 ring-indigo-400 bg-indigo-50" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      {children}
    </div>
  );
}
