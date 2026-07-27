"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { generateCasesPreview, insertDraftCases } from "@/app/actions/ai";
import type { DraftCase } from "@/lib/ai";

// F-29 feature 1: paste a requirement → AI proposes draft cases → preview and
// select → insert as DRAFT. Opt-in per click; only rendered when AI is
// configured for the org.
export function AiGenerateCases({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cases, setCases] = useState<DraftCase[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const reset = () => {
    setText("");
    setCases(null);
    setSelected(new Set());
    setError(null);
  };

  const generate = () =>
    startBusy(async () => {
      setError(null);
      const res = await generateCasesPreview(projectId, text);
      if (res.error) {
        setError(res.error);
        setCases(null);
      } else {
        setCases(res.cases!);
        setSelected(new Set(res.cases!.map((_, i) => i)));
      }
    });

  const insert = () =>
    startBusy(async () => {
      setError(null);
      const chosen = (cases ?? []).filter((_, i) => selected.has(i));
      const res = await insertDraftCases(projectId, chosen);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        reset();
        router.refresh();
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="ai-generate-open"
        className="rounded-lg border border-accent-ring bg-accent-soft px-3 py-2 text-sm text-accent-soft-fg hover:bg-accent-soft"
      >
        <span className="inline-flex items-center gap-1.5">
          <TFIcon name="ai" className="h-4 w-4" /> Generate with AI
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8 motion-safe:animate-tf-fade-in">
          <div
            className="w-full max-w-2xl rounded-xl border border-hairline bg-surface p-6 shadow-xl motion-safe:animate-tf-pop-in"
            data-testid="ai-generate-modal"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generate test cases with AI</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-sm text-content-subtle hover:text-content"
              >
                Close
              </button>
            </div>

            {!cases ? (
              <>
                <p className="mb-2 text-sm text-content-muted">
                  Paste a requirement or PRD excerpt. Proposed cases are inserted
                  as DRAFT for you to review.
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder="As a user, I want to reset my password so that…"
                  data-testid="ai-generate-input"
                  className="w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                />
                {error && (
                  <p className="mt-2 text-sm text-danger" data-testid="ai-generate-error">
                    {error}
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={generate}
                    disabled={busy || !text.trim()}
                    data-testid="ai-generate-submit"
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {busy ? "Generating…" : "Generate"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm text-content-muted">
                  {selected.size} of {cases.length} selected. Selected cases are
                  inserted as DRAFT.
                </p>
                <ul className="max-h-80 space-y-2 overflow-y-auto" data-testid="ai-generate-preview">
                  {cases.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-hairline p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(i);
                          else next.delete(i);
                          setSelected(next);
                        }}
                        className="mt-1"
                        data-testid={`ai-generate-check-${i}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-content-subtle">
                          {c.priority} · {c.type} · {c.steps.length} step
                          {c.steps.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {error && (
                  <p className="mt-2 text-sm text-danger" data-testid="ai-generate-error">
                    {error}
                  </p>
                )}
                <div className="mt-3 flex justify-between">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1 rounded-lg border border-hairline-strong px-3 py-2 text-sm text-content hover:bg-surface-muted"
                  >
                    <TFIcon name="chevron-left" className="h-4 w-4" />
                    Start over
                  </button>
                  <button
                    onClick={insert}
                    disabled={busy || selected.size === 0}
                    data-testid="ai-generate-insert"
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {busy ? "Inserting…" : `Insert ${selected.size} as DRAFT`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
