"use client";

// F-17: pick exactly two runs on the runs list and jump to
// runs/compare?a=<first>&b=<second>. Selection order matters: the first
// checked run becomes A (baseline), the second becomes B.
import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";

const Ctx = createContext<{
  selected: string[];
  toggle: (id: string) => void;
} | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  return <Ctx.Provider value={{ selected, toggle }}>{children}</Ctx.Provider>;
}

export function CompareCheckbox({ runId }: { runId: string }) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  return (
    <input
      type="checkbox"
      checked={ctx.selected.includes(runId)}
      onChange={() => ctx.toggle(runId)}
      title="Compare"
      data-testid={`compare-check-${runId}`}
      className="h-4 w-4 cursor-pointer rounded border-hairline-strong accent-accent"
    />
  );
}

export function CompareBar({ slug }: { slug: string }) {
  const ctx = useContext(Ctx);
  if (!ctx || ctx.selected.length === 0) return null;
  const [a, b] = ctx.selected;
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-ring bg-accent-soft px-4 py-2 text-sm"
      data-testid="compare-bar"
    >
      <span>
        <b>{ctx.selected.length}</b> selected for comparison
      </span>
      {ctx.selected.length === 2 ? (
        <Link
          href={`/projects/${slug}/runs/compare?a=${a}&b=${b}`}
          className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
          data-testid="compare-go"
        >
          Compare A → B
        </Link>
      ) : (
        <span className="text-content-muted">
          {ctx.selected.length > 2
            ? "Uncheck until exactly two runs are selected."
            : "Check one more run to compare."}
        </span>
      )}
    </div>
  );
}
