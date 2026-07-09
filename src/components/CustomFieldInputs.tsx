"use client";

// F-03: renders one input per custom field def, named `custom_<key>` so both
// real <form> submissions (CaseForm) and manual FormData collection
// (RunExecutor querying [name^="custom_"]) pick them up. Uncontrolled —
// remount with a key when the entity changes.

export type CustomDefItem = {
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
};

export type MemberOption = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";

export function CustomFieldInputs({
  defs,
  values = {},
  members = [],
}: {
  defs: CustomDefItem[];
  values?: Record<string, unknown>;
  members?: MemberOption[];
}) {
  if (defs.length === 0) return null;
  return (
    <>
      {defs.map((def) => {
        const name = `custom_${def.key}`;
        const v = values[def.key];
        const req = def.required ? <span className="text-red-500"> *</span> : null;
        const testId = `custom-${def.key}`;
        switch (def.type) {
          case "TEXTAREA":
            return (
              <div key={def.key} className="md:col-span-2">
                <label className={labelCls}>{def.label}{req}</label>
                <textarea name={name} rows={2} defaultValue={(v as string) ?? ""} className={inputCls} data-testid={testId} />
              </div>
            );
          case "NUMBER":
            return (
              <div key={def.key}>
                <label className={labelCls}>{def.label}{req}</label>
                <input name={name} type="number" step="any" defaultValue={v == null ? "" : String(v)} className={inputCls} data-testid={testId} />
              </div>
            );
          case "CHECKBOX":
            return (
              <label key={def.key} className="flex items-center gap-1.5 pt-6 text-sm">
                <input type="checkbox" name={name} defaultChecked={Boolean(v)} data-testid={testId} /> {def.label}{req}
              </label>
            );
          case "DATE":
            return (
              <div key={def.key}>
                <label className={labelCls}>{def.label}{req}</label>
                <input name={name} type="date" defaultValue={(v as string) ?? ""} className={inputCls} data-testid={testId} />
              </div>
            );
          case "USER":
            return (
              <div key={def.key}>
                <label className={labelCls}>{def.label}{req}</label>
                <select name={name} defaultValue={(v as string) ?? ""} className={inputCls} data-testid={testId}>
                  <option value="">—</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            );
          case "DROPDOWN":
            return (
              <div key={def.key}>
                <label className={labelCls}>{def.label}{req}</label>
                <select name={name} defaultValue={(v as string) ?? ""} className={inputCls} data-testid={testId}>
                  <option value="">—</option>
                  {def.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          case "MULTISELECT": {
            const selected = new Set(Array.isArray(v) ? (v as string[]) : []);
            return (
              <div key={def.key} className="md:col-span-2">
                <label className={labelCls}>{def.label}{req}</label>
                <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 px-3 py-2" data-testid={testId}>
                  {def.options.map((o) => (
                    <label key={o} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name={name} value={o} defaultChecked={selected.has(o)} /> {o}
                    </label>
                  ))}
                </div>
              </div>
            );
          }
          default: // TEXT
            return (
              <div key={def.key}>
                <label className={labelCls}>{def.label}{req}</label>
                <input name={name} defaultValue={(v as string) ?? ""} className={inputCls} data-testid={testId} />
              </div>
            );
        }
      })}
    </>
  );
}
