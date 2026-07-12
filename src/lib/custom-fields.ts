import type { CustomFieldDef } from "@prisma/client";

// F-03 shared validation & helpers for custom field values.
// A value object is always shaped {key: value} and stored on the entity as
// customJson. Validation coerces form strings (NUMBER "42" → 42, CHECKBOX
// "on" → true) so both HTML forms and typed API JSON pass through one path.

export const CUSTOM_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "CHECKBOX",
  "DATE",
  "URL",
  "USER",
  "DROPDOWN",
  "MULTISELECT",
] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const FIELD_KEY_RE = /^[a-z][a-z0-9_]{1,30}$/;

export type CustomValue = string | number | boolean | string[];
export type CustomValues = Record<string, CustomValue>;

export function parseOptions(def: CustomFieldDef): string[] {
  try {
    const arr = JSON.parse(def.optionsJson || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function isEmpty(v: unknown): boolean {
  return (
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

/**
 * Validate raw input against the ACTIVE defs. Unknown keys are rejected;
 * required active fields must be present and non-empty; values are coerced
 * to their canonical type. `memberIds` backs the USER type check.
 */
export function validateCustomValues(
  defs: CustomFieldDef[],
  input: Record<string, unknown>,
  memberIds: Set<string>
):
  | { ok: true; values: CustomValues }
  | { ok: false; errors: { field: string; message: string }[] } {
  const active = defs.filter((d) => d.active);
  const byKey = new Map(active.map((d) => [d.key, d]));
  const errors: { field: string; message: string }[] = [];
  const values: CustomValues = {};

  for (const key of Object.keys(input)) {
    if (!byKey.has(key))
      errors.push({ field: `custom.${key}`, message: "Unknown field" });
  }

  for (const def of active) {
    const raw = input[def.key];
    if (isEmpty(raw)) {
      if (def.required)
        errors.push({ field: `custom.${def.key}`, message: `${def.label} is required` });
      continue;
    }
    const fail = (message: string) =>
      errors.push({ field: `custom.${def.key}`, message });

    switch (def.type as CustomFieldType) {
      case "TEXT":
      case "TEXTAREA":
        values[def.key] = String(raw).trim();
        break;
      case "NUMBER": {
        const n = typeof raw === "number" ? raw : Number(String(raw).trim());
        if (!Number.isFinite(n)) fail("Must be a number");
        else values[def.key] = n;
        break;
      }
      case "CHECKBOX":
        values[def.key] = raw === true || raw === "on" || raw === "true";
        break;
      case "DATE": {
        const s = String(raw).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s)))
          fail("Must be a date (YYYY-MM-DD)");
        else values[def.key] = s;
        break;
      }
      case "URL": {
        const s = String(raw).trim();
        try {
          const u = new URL(s);
          if (!["http:", "https:"].includes(u.protocol)) throw new Error();
          values[def.key] = s;
        } catch {
          fail("Must be an http(s) URL");
        }
        break;
      }
      case "USER": {
        const s = String(raw).trim();
        if (!memberIds.has(s)) fail("Must be a project member");
        else values[def.key] = s;
        break;
      }
      case "DROPDOWN": {
        const s = String(raw).trim();
        if (!parseOptions(def).includes(s)) fail("Not one of the allowed options");
        else values[def.key] = s;
        break;
      }
      case "MULTISELECT": {
        const arr = Array.isArray(raw) ? raw.map(String) : [String(raw)];
        const opts = parseOptions(def);
        const bad = arr.filter((v) => !opts.includes(v));
        if (bad.length) fail(`Not allowed: ${bad.join(", ")}`);
        else values[def.key] = arr;
        break;
      }
      default:
        fail("Unsupported field type");
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, values };
}

/**
 * Collect `custom_<key>` entries from a form submission into a raw input
 * object keyed by def key (multiselect uses getAll). Missing checkboxes
 * become false-y absent — validate handles required-ness.
 */
export function collectCustomFromForm(
  defs: CustomFieldDef[],
  formData: FormData
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const def of defs.filter((d) => d.active)) {
    const name = `custom_${def.key}`;
    if (def.type === "MULTISELECT") {
      const all = formData.getAll(name).map(String).filter(Boolean);
      if (all.length) input[def.key] = all;
    } else {
      const v = formData.get(name);
      if (v !== null && String(v) !== "") input[def.key] = String(v);
    }
  }
  return input;
}

/**
 * Merge freshly validated ACTIVE values over the existing stored object,
 * preserving values of inactive/legacy keys (they render read-only but are
 * never silently dropped by an edit).
 */
export function mergeCustomJson(
  existingJson: string | null | undefined,
  defs: CustomFieldDef[],
  values: CustomValues
): string {
  let existing: CustomValues = {};
  try {
    existing = JSON.parse(existingJson || "{}");
  } catch {
    existing = {};
  }
  const activeKeys = new Set(defs.filter((d) => d.active).map((d) => d.key));
  const merged: CustomValues = {};
  for (const [k, v] of Object.entries(existing))
    if (!activeKeys.has(k)) merged[k] = v;
  Object.assign(merged, values);
  return JSON.stringify(merged);
}

/** Human-readable cell/CSV rendering of one value. */
export function formatCustomValue(
  def: CustomFieldDef,
  value: CustomValue | undefined,
  memberNames?: Map<string, string>
): string {
  if (isEmpty(value)) return "";
  switch (def.type as CustomFieldType) {
    case "CHECKBOX":
      return value ? "true" : "false";
    case "MULTISELECT":
      return (value as string[]).join("; ");
    case "USER":
      return memberNames?.get(String(value)) ?? String(value);
    default:
      return String(value);
  }
}

// F-03/F-14: API shape for a field def (lives here — Next.js route files may
// only export HTTP handlers).
export function serializeFieldDef(d: CustomFieldDef) {
  return {
    id: d.id,
    entity: d.entity,
    key: d.key,
    label: d.label,
    type: d.type,
    options: parseOptions(d),
    required: d.required,
    order: d.order,
    active: d.active,
  };
}
