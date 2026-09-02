"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createTemplateFromJson,
  updateTemplate,
} from "@/app/actions/superadmin-templates";
import { TEMPLATE_CATEGORIES } from "@/lib/templates/schema";

// F-47: the authoring surface for the instance console. A paste box, not a
// nested form builder — a template is authored in bulk and previewed as a
// whole, and a builder for a three-level tree of cases with steps is a lot of
// UI for something an operator does a handful of times.
//
// Validation is server-side only, on purpose. The client could run the same
// parseTemplateContent (it is pure), but then two copies of "is this valid"
// exist and the one that matters is the one that already runs on save.

const FIELD =
  "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-content-strong focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring";

export function TemplateJsonEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: {
    slug: string;
    name: string;
    summary: string;
    description: string;
    category: string;
    contentJson: string;
    builtIn: boolean;
  };
}) {
  const action = mode === "create" ? createTemplateFromJson : updateTemplate;
  const [state, formAction] = useFormState(action, {});
  const [json, setJson] = useState(
    initial?.contentJson ??
      JSON.stringify(
        {
          variables: [],
          suites: [
            {
              key: "example-suite",
              name: "Example suite",
              cases: [
                {
                  key: "example-case",
                  title: "Example case",
                  coverage: "positive",
                  priority: "MEDIUM",
                  type: "FUNCTIONAL",
                  preconditions: "",
                  steps: [{ action: "Do the thing", expected: "It happened" }],
                  expectedResult: "",
                  tags: [],
                },
              ],
              suites: [],
            },
          ],
        },
        null,
        2,
      ),
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && <input type="hidden" name="slug" value={initial?.slug} />}

      {initial?.builtIn && (
        <p className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning-soft-fg">
          This is a built-in template. The repository owns its content, so edits
          here are overwritten on the next deploy. To take it out of circulation,
          unpublish it instead — that choice survives deploys.
        </p>
      )}

      {state?.error && (
        <pre
          data-testid="tpl-admin-error"
          className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-soft-fg"
        >
          {state.error}
        </pre>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="slug" className="text-sm font-medium">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={initial?.slug}
            disabled={mode === "edit"}
            placeholder="login-authentication"
            data-testid="tpl-admin-slug"
            className={`${FIELD} disabled:opacity-60`}
          />
          <p className="text-xs text-content-subtle">
            {mode === "edit"
              ? "Fixed after creation — it is the template's URL."
              : "Lowercase letters, digits and hyphens. Used in the URL."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? "GENERAL"}
            data-testid="tpl-admin-category"
            className={FIELD}
          >
            {TEMPLATE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="Login &amp; Authentication"
          data-testid="tpl-admin-name"
          className={FIELD}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="summary" className="text-sm font-medium">
          Summary
        </label>
        <input
          id="summary"
          name="summary"
          defaultValue={initial?.summary}
          data-testid="tpl-admin-summary"
          className={FIELD}
        />
        <p className="text-xs text-content-subtle">One line, shown on the gallery card.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description}
          data-testid="tpl-admin-description"
          className={`${FIELD} font-mono`}
        />
        <p className="text-xs text-content-subtle">
          Markdown, shown above the preview tree.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contentJson" className="text-sm font-medium">
          Content (JSON)
        </label>
        <textarea
          id="contentJson"
          name="contentJson"
          rows={24}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          data-testid="tpl-admin-json"
          className={`${FIELD} font-mono text-xs`}
        />
        <p className="text-xs text-content-subtle">
          <code>{`{variables?: [{key,label,default}], suites: [{key, name, description?, cases: [{key, title, coverage, priority, type, steps: [{action, expected}], ...}], suites?: []}]}`}</code>
        </p>
      </div>

      <SaveButton mode={mode} />
    </form>
  );
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="tpl-admin-save"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2"
    >
      {pending
        ? "Validating…"
        : mode === "create"
          ? "Validate & create"
          : "Validate & save"}
    </button>
  );
}
