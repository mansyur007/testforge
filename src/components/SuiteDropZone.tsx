"use client";

import { useRef, useState, useTransition } from "react";
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
  // dragenter/dragleave bubble from children, so track depth to avoid flicker.
  const depth = useRef(0);
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
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes(CASE_DND_MIME)) return;
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(CASE_DND_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setOver(false);
        }
      }}
      onDrop={(e) => {
        depth.current = 0;
        setOver(false);
        onDrop(e);
      }}
      className={`${className} rounded motion-safe:transition-[background-color,box-shadow] motion-safe:duration-fast motion-safe:ease-tf-out ${
        over
          ? "bg-accent-soft shadow-[0_0_0_2px_theme(colors.indigo.400)]"
          : "shadow-[0_0_0_0_transparent]"
      } ${pending ? "opacity-60" : ""}`}
    >
      {children}
    </div>
  );
}
