"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  createFieldDef,
  updateFieldDef,
  toggleFieldActive,
  moveFieldDef,
} from "@/app/actions/custom-fields";
import { CUSTOM_FIELD_TYPES } from "@/lib/custom-fields";

export type FieldDefItem = {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
  active: boolean;
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";

function EditRowForm({ def, onDone }: { def: FieldDefItem; onDone: () => void }) {
  const [state, action] = useFormState(updateFieldDef, undefined);
  useEffect(() => {
    if (state && "ok" in state && state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="fieldId" value={def.id} />
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className={labelCls}>Label</label>
          <input name="label" defaultValue={def.label} className={inputCls} />
        </div>
        {["DROPDOWN", "MULTISELECT"].includes(def.type) && (
          <div className="min-w-56 flex-1">
            <label className={labelCls}>Options (comma-separated)</label>
            <input name="options" defaultValue={def.options.join(", ")} className={inputCls} />
          </div>
        )}
        <label className="flex items-center gap-1.5 pb-2 text-sm">
          <input type="checkbox" name="required" defaultChecked={def.required} /> Required
        </label>
        <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Save
        </button>
        <button type="button" onClick={onDone} className="px-2 py-2 text-sm text-slate-500">
          Cancel
        </button>
      </div>
      {state && "error" in state && state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}

function DefRow({ def, canManage }: { def: FieldDefItem; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className={`rounded-lg border border-slate-200 px-4 py-3 ${def.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{def.label}</span>
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{def.key}</code>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {def.type}
        </span>
        {def.required && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">required</span>
        )}
        {!def.active && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">disabled</span>
        )}
        {def.options.length > 0 && (
          <span className="truncate text-xs text-slate-400">[{def.options.join(", ")}]</span>
        )}
        {canManage && (
          <span className="ml-auto flex items-center gap-1">
            <form action={moveFieldDef}>
              <input type="hidden" name="fieldId" value={def.id} />
              <input type="hidden" name="dir" value="up" />
              <button title="Move up" className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↑</button>
            </form>
            <form action={moveFieldDef}>
              <input type="hidden" name="fieldId" value={def.id} />
              <input type="hidden" name="dir" value="down" />
              <button title="Move down" className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">↓</button>
            </form>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
            >
              Edit
            </button>
            <form action={toggleFieldActive}>
              <input type="hidden" name="fieldId" value={def.id} />
              <button
                data-testid={`field-toggle-${def.key}`}
                className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                {def.active ? "Disable" : "Enable"}
              </button>
            </form>
          </span>
        )}
      </div>
      {editing && <EditRowForm def={def} onDone={() => setEditing(false)} />}
    </li>
  );
}

export function CustomFieldsManager({
  projectId,
  defs,
  canManage,
}: {
  projectId: string;
  defs: FieldDefItem[];
  canManage: boolean;
}) {
  const [state, action] = useFormState(createFieldDef, undefined);
  const [type, setType] = useState<string>("TEXT");
  const needsOptions = ["DROPDOWN", "MULTISELECT"].includes(type);

  const section = (entity: "CASE" | "RESULT", title: string, hint: string) => {
    const list = defs.filter((d) => d.entity === entity);
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-slate-400">{hint}</p>
        {list.length === 0 ? (
          <p className="text-sm text-slate-400">No custom fields yet.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((d) => (
              <DefRow key={d.id} def={d} canManage={canManage} />
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {section("CASE", "Test case fields", "Shown on the case form, detail page, CSV, and API.")}
      {section("RESULT", "Run result fields", "Shown in the run executor when recording a result.")}

      {canManage && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-semibold">Add field</h3>
          <form action={action} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="projectId" value={projectId} />
            <div>
              <label className={labelCls}>Applies to</label>
              <select name="entity" className={inputCls}>
                <option value="CASE">Test case</option>
                <option value="RESULT">Run result</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputCls}
                data-testid="field-type"
              >
                {CUSTOM_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Label</label>
              <input name="label" placeholder="e.g. Component" className={inputCls} data-testid="field-label" />
            </div>
            <div>
              <label className={labelCls}>Key (a-z, 0-9, _)</label>
              <input name="key" placeholder="e.g. component" className={inputCls} data-testid="field-key" />
            </div>
            {needsOptions && (
              <div className="md:col-span-2">
                <label className={labelCls}>Options (comma or newline separated)</label>
                <textarea name="options" rows={2} placeholder="api, web, mobile" className={inputCls} data-testid="field-options" />
              </div>
            )}
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="required" data-testid="field-required" /> Required
            </label>
            <div className="md:col-span-2">
              {state && "error" in state && state.error && (
                <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
              )}
              <button
                data-testid="field-create"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create field
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
