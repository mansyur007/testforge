"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { TFIcon } from "@/components/icons";
import { FOCUS_RING, FOCUS_RING_FIELD } from "@/components/focus";
import { applyTemplateAction } from "@/app/actions/templates";
import {
  COVERAGE_BADGES,
  COVERAGE_LABELS,
  CASE_FORM_STATUS_HINT,
  countPruned,
  pruneToSelection,
  selectAll,
  type TemplateContent,
  type TemplateSuite,
} from "@/lib/templates/schema";

// F-47: the preview + selection screen. The tree on the left is what the user
// unchecks; the panel on the right is where it lands.
//
// The live count is computed with the SAME pruneToSelection the server applies
// with (it lives in content-core.mjs, which is pure and has no server-only), so
// the number on the button cannot drift from the number of rows created — the
// classic failure of a preview that re-implements its own counting.

type ProjectSuite = { id: string; name: string; parentId: string | null };

export function TemplateApplyForm({
  projectSlug,
  templateSlug,
  content,
  suites,
  existingSuiteNames,
  canWrite,
}: {
  projectSlug: string;
  templateSlug: string;
  content: TemplateContent;
  suites: ProjectSuite[];
  existingSuiteNames: string[];
  canWrite: boolean;
}) {
  const [state, formAction] = useFormState(applyTemplateAction, {});

  const everything = useMemo(() => selectAll(content), [content]);
  const [checkedSuites, setCheckedSuites] = useState<Set<string>>(
    () => new Set(everything.suiteKeys),
  );
  const [checkedCases, setCheckedCases] = useState<Set<string>>(
    () => new Set(everything.caseKeys),
  );
  const [targetSuiteId, setTargetSuiteId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [vars, setVars] = useState<Record<string, string>>(() =>
    Object.fromEntries(content.variables.map((v) => [v.key, v.default])),
  );

  const totals = useMemo(
    () =>
      countPruned(
        pruneToSelection(content.suites, {
          suiteKeys: Array.from(checkedSuites),
          caseKeys: Array.from(checkedCases),
        }),
      ),
    [content.suites, checkedSuites, checkedCases],
  );

  // Substitution is previewed live so a variable is visibly doing something
  // before the user commits to thirty renamed cases.
  const preview = (text: string) =>
    text.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_m, k) => vars[k] ?? "");

  /** Toggling a suite takes its whole subtree with it. */
  const toggleSuite = (suite: TemplateSuite, on: boolean) => {
    const suiteKeys = new Set(checkedSuites);
    const caseKeys = new Set(checkedCases);
    const recurse = (s: TemplateSuite) => {
      if (on) suiteKeys.add(s.key);
      else suiteKeys.delete(s.key);
      for (const c of s.cases) {
        if (on) caseKeys.add(c.key);
        else caseKeys.delete(c.key);
      }
      s.suites.forEach(recurse);
    };
    recurse(suite);
    setCheckedSuites(suiteKeys);
    setCheckedCases(caseKeys);
  };

  const toggleCase = (key: string, on: boolean) => {
    const next = new Set(checkedCases);
    if (on) next.add(key);
    else next.delete(key);
    setCheckedCases(next);
  };

  const subtreeCaseKeys = (s: TemplateSuite): string[] => [
    ...s.cases.map((c) => c.key),
    ...s.suites.flatMap(subtreeCaseKeys),
  ];

  const setAll = (on: boolean) => {
    setCheckedSuites(on ? new Set(everything.suiteKeys) : new Set());
    setCheckedCases(on ? new Set(everything.caseKeys) : new Set());
  };

  // Applying creates a second suite rather than merging into the existing one,
  // so name it up front instead of letting the user discover the duplicate.
  const collisions = useMemo(() => {
    const existing = new Set(existingSuiteNames.map((n) => n.toLowerCase()));
    return content.suites
      .map((s) => preview(s.name))
      .filter((n) => existing.has(n.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.suites, existingSuiteNames, vars]);

  const renderSuite = (suite: TemplateSuite, depth: number) => {
    const caseKeys = subtreeCaseKeys(suite);
    const checkedCount = caseKeys.filter((k) => checkedCases.has(k)).length;
    const all = caseKeys.length > 0 && checkedCount === caseKeys.length;
    const some = checkedCount > 0 && !all;

    return (
      <li key={suite.key} className={depth > 0 ? "ml-5 border-l border-hairline pl-4" : ""}>
        <label className="flex cursor-pointer items-center gap-2 py-1.5">
          <input
            type="checkbox"
            checked={all || (caseKeys.length === 0 && checkedSuites.has(suite.key))}
            ref={(el) => {
              if (el) el.indeterminate = some;
            }}
            onChange={(e) => toggleSuite(suite, e.target.checked)}
            data-testid={`tpl-suite-${suite.key}`}
            className={`h-4 w-4 rounded border-hairline-strong accent-accent ${FOCUS_RING_FIELD}`}
          />
          <TFIcon name="folder" className="h-4 w-4 text-content-subtle" />
          <span className="font-medium text-content-strong">{preview(suite.name)}</span>
          <span className="text-xs text-content-subtle">
            {checkedCount}/{caseKeys.length}
          </span>
        </label>

        {suite.cases.length > 0 && (
          <ul className="ml-6 border-l border-hairline pl-4">
            {suite.cases.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-start gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={checkedCases.has(c.key)}
                    onChange={(e) => toggleCase(c.key, e.target.checked)}
                    data-testid={`tpl-case-${c.key}`}
                    className={`mt-0.5 h-4 w-4 rounded border-hairline-strong accent-accent ${FOCUS_RING_FIELD}`}
                  />
                  <span className="min-w-0 flex-1 text-sm text-content">
                    {preview(c.title)}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${COVERAGE_BADGES[c.coverage]}`}
                  >
                    {COVERAGE_LABELS[c.coverage]}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {suite.suites.length > 0 && (
          <ul>{suite.suites.map((s) => renderSuite(s, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <input type="hidden" name="projectSlug" value={projectSlug} />
      <input type="hidden" name="templateSlug" value={templateSlug} />
      {Array.from(checkedSuites).map((k) => (
        <input key={k} type="hidden" name="suiteKeys" value={k} />
      ))}
      {Array.from(checkedCases).map((k) => (
        <input key={k} type="hidden" name="caseKeys" value={k} />
      ))}

      {/* ---- selection tree ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-content-strong">
            What will be created
          </h3>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setAll(true)}
              className={`rounded px-2 py-1 text-content-muted hover:bg-surface-muted ${FOCUS_RING}`}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              data-testid="tpl-clear-all"
              className={`rounded px-2 py-1 text-content-muted hover:bg-surface-muted ${FOCUS_RING}`}
            >
              Clear
            </button>
          </div>
        </div>

        <ul
          data-testid="tpl-tree"
          className="rounded-xl border border-hairline bg-surface p-3"
        >
          {content.suites.map((s) => renderSuite(s, 0))}
        </ul>
      </div>

      {/* ---- apply panel ---- */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        {collisions.length > 0 && (
          <p
            data-testid="tpl-collision-warning"
            className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-xs text-warning-soft-fg"
          >
            This project already has a suite named{" "}
            {collisions.map((n) => `"${n}"`).join(", ")}. Applying creates a
            second one rather than merging into it.
          </p>
        )}

        {state?.error && (
          <p
            data-testid="tpl-error"
            className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-soft-fg"
          >
            {state.error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="targetSuiteId" className="text-sm font-medium">
            Add to
          </label>
          <select
            id="targetSuiteId"
            name="targetSuiteId"
            value={targetSuiteId}
            onChange={(e) => setTargetSuiteId(e.target.value)}
            data-testid="tpl-target"
            className={`w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm ${FOCUS_RING_FIELD}`}
          >
            <option value="">Project root</option>
            {suites.map((s) => (
              <option key={s.id} value={s.id}>
                {suitePath(s, suites)}
              </option>
            ))}
          </select>
        </div>

        {content.variables.length > 0 && (
          <div className="space-y-3 rounded-lg border border-hairline p-3">
            <p className="text-xs text-content-muted">
              This template is written with placeholders. Fill them in and every
              title and step below updates.
            </p>
            {content.variables.map((v) => (
              <div key={v.key} className="space-y-1.5">
                <label htmlFor={`var_${v.key}`} className="text-sm font-medium">
                  {v.label}
                </label>
                <input
                  id={`var_${v.key}`}
                  name={`var_${v.key}`}
                  value={vars[v.key] ?? ""}
                  onChange={(e) => setVars({ ...vars, [v.key]: e.target.value })}
                  placeholder={v.default}
                  data-testid={`tpl-var-${v.key}`}
                  className={`w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm ${FOCUS_RING_FIELD}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Create cases as
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            data-testid="tpl-status"
            className={`w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm ${FOCUS_RING_FIELD}`}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
          <p className="text-xs text-content-subtle">{CASE_FORM_STATUS_HINT}</p>
        </div>

        <div className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
          <span data-testid="tpl-count" className="font-medium text-content-strong">
            {plural(totals.suites, "suite")} · {plural(totals.cases, "test case")}
          </span>
          <span className="block text-xs text-content-muted">
            will be added to this project
          </span>
        </div>

        <ApplyButton disabled={!canWrite || totals.suites === 0} />
      </div>
    </form>
  );
}

function ApplyButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      data-testid="tpl-apply"
      className={`w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50 ${FOCUS_RING}`}
    >
      {pending ? "Applying…" : "Apply template"}
    </button>
  );
}

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/** "Auth › Login", so two same-named suites in different branches are told apart. */
function suitePath(suite: ProjectSuite, all: ProjectSuite[]): string {
  const names: string[] = [];
  let cur: ProjectSuite | undefined = suite;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    names.unshift(cur.name);
    cur = all.find((s) => s.id === cur?.parentId);
  }
  return names.join(" › ");
}
