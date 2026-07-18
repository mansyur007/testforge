"use client";

import { useState, useTransition } from "react";
import { TFIcon } from "@/components/icons";
import { suggestStepsForCase } from "@/app/actions/ai";

// F-29 feature 2: on-demand edge-case step suggestions for an open case. This
// is read-only advice (the tester copies what's useful into the case) — opt-in
// per click, only rendered when AI is configured.
export function AiSuggestSteps({ caseId }: { caseId: string }) {
  const [steps, setSteps] = useState<{ action: string; expected: string }[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const run = () =>
    startBusy(async () => {
      setError(null);
      const res = await suggestStepsForCase(caseId);
      if (res.error) setError(res.error);
      else setSteps(res.steps ?? []);
    });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6" data-testid="ai-suggest-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-slate-400">
          AI edge-case suggestions
        </h3>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          data-testid="ai-suggest-run"
          className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1">
            <TFIcon name="ai" className="h-3.5 w-3.5" /> {busy ? "Thinking…" : "Suggest"}
          </span>
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600" data-testid="ai-suggest-error">
          {error}
        </p>
      )}
      {steps && steps.length === 0 && !error && (
        <p className="text-sm text-slate-400" data-testid="ai-suggest-empty">
          No additional edge cases suggested — looks thorough.
        </p>
      )}
      {steps && steps.length > 0 && (
        <ol className="space-y-2" data-testid="ai-suggest-list">
          {steps.map((s, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{s.action}</span>
              {s.expected && (
                <span className="text-slate-500"> ↳ {s.expected}</span>
              )}
            </li>
          ))}
        </ol>
      )}
      {!steps && !error && (
        <p className="text-xs text-slate-400">
          Ask the model for edge-case and negative-path steps this case may be
          missing.
        </p>
      )}
    </section>
  );
}
