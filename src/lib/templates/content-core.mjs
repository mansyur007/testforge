// F-47: the template content format and its validator.
//
// Plain ESM with no database, no Next runtime and no TypeScript, for the same
// reason `src/lib/academy/exam-core.mjs` is: `scripts/templates-selftest.mjs`
// runs it under bare `node` from `prebuild`, so `npm run build` covers it with
// no CI change. `src/lib/templates/schema.ts` is the thin typed layer over it.
//
// This module is the ONLY door content walks through. The superadmin import
// route, the built-in packs and the selftest all call `parseTemplateContent`,
// so the apply engine may assume a parsed tree is well-formed: enums are real,
// keys are unique, nesting is bounded, every {{VAR}} is declared, and the whole
// thing is small enough to write inside one transaction.

/**
 * The coverage taxonomy — the point of the feature. Every template case
 * declares exactly one, it is emitted onto the created case as a real
 * `coverage:<x>` tag, and the preview screen renders the distribution so a
 * positive-only pack is visibly thin before anyone applies it.
 */
export const COVERAGE_KINDS = [
  "positive",
  "negative",
  "boundary",
  "security",
  "permission",
  "usability",
  "compatibility",
];

export const TEMPLATE_CATEGORIES = [
  "AUTH",
  "ONBOARDING",
  "CRUD",
  "COMMERCE",
  "GENERAL",
];

// Local copies of the case vocabularies from `src/lib/constants.ts`, which is
// TypeScript and therefore unreachable from bare `node`. Duplication is the
// cost of keeping this file testable; `scripts/templates-selftest.mjs` reads
// constants.ts as text and fails the build if the two ever drift, which is the
// failure that would otherwise be silent (a new CASE_TYPE that every template
// rejects for no visible reason).
export const TEMPLATE_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const TEMPLATE_CASE_TYPES = [
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "PERFORMANCE",
  "SECURITY",
  "E2E",
];

// A template is a starter pack, not a bulk-import channel — `/api/import/cases`
// already exists for that. These caps are what let the apply engine run in one
// transaction without an unbounded write, which SQLite in particular would not
// enjoy.
export const LIMITS = {
  suites: 60,
  cases: 400,
  depth: 3,
  stepsPerCase: 50,
  bytes: 256 * 1024,
};

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,48}$/;
const VAR_KEY_RE = /^[A-Z][A-Z0-9_]{0,30}$/;
const VAR_REF_RE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/** Every {{VAR}} referenced anywhere in a string. */
export function referencedVariables(text) {
  const out = [];
  if (typeof text !== "string") return out;
  for (const m of text.matchAll(VAR_REF_RE)) out.push(m[1]);
  return out;
}

/**
 * Replace every {{VAR}} with its value, falling back to the declared default.
 * An unresolved placeholder is never left in a user's data: an undeclared name
 * (which the validator rejects, so this is belt-and-braces) collapses to "".
 */
export function substituteVariables(text, values) {
  if (typeof text !== "string") return text;
  return text.replace(VAR_REF_RE, (_all, key) => {
    const v = values?.[key];
    return typeof v === "string" ? v : "";
  });
}

/** Depth-first walk over every case in a parsed tree, deepest suite last. */
export function walkTemplate(content, visit) {
  const recurse = (suites, path) => {
    for (const suite of suites) {
      const here = [...path, suite];
      for (const c of suite.cases ?? []) visit(c, here);
      recurse(suite.suites ?? [], here);
    }
  };
  recurse(content.suites ?? [], []);
}

export function countTemplate(content) {
  let suites = 0;
  let cases = 0;
  const recurse = (list) => {
    for (const s of list) {
      suites++;
      cases += (s.cases ?? []).length;
      recurse(s.suites ?? []);
    }
  };
  recurse(content?.suites ?? []);
  return { suites, cases };
}

/** Coverage tag → number of cases carrying it, for the preview distribution. */
export function coverageBreakdown(content) {
  const out = {};
  for (const k of COVERAGE_KINDS) out[k] = 0;
  walkTemplate(content, (c) => {
    if (out[c.coverage] !== undefined) out[c.coverage]++;
  });
  return out;
}

/**
 * Prune a parsed tree to what the user checked.
 *
 * A suite survives if it was checked itself, if it directly holds a checked
 * case, or if any descendant survives — that last clause is what stops a
 * checked case from being orphaned when its parent suite was left unchecked.
 *
 * Returns `[{source, cases, children}]`, where `cases` are the surviving cases
 * of that suite.
 */
export function pruneToSelection(suites, selection) {
  const wantSuite = new Set(selection?.suiteKeys ?? []);
  const wantCase = new Set(selection?.caseKeys ?? []);

  const walk = (suite) => {
    const cases = (suite.cases ?? []).filter((c) => wantCase.has(c.key));
    const children = (suite.suites ?? []).map(walk).filter(Boolean);
    if (cases.length === 0 && children.length === 0 && !wantSuite.has(suite.key)) {
      return null;
    }
    return { source: suite, cases, children };
  };

  return (suites ?? []).map(walk).filter(Boolean);
}

/** Suite/case totals of a pruned tree — what the preview counts down to. */
export function countPruned(pruned) {
  let suites = 0;
  let cases = 0;
  const recurse = (list) => {
    for (const s of list) {
      suites++;
      cases += s.cases.length;
      recurse(s.children);
    }
  };
  recurse(pruned ?? []);
  return { suites, cases };
}

/** Everything selected — the default when the user applies without unchecking. */
export function selectAll(content) {
  const suiteKeys = [];
  const caseKeys = [];
  const recurse = (list) => {
    for (const s of list) {
      suiteKeys.push(s.key);
      for (const c of s.cases ?? []) caseKeys.push(c.key);
      recurse(s.suites ?? []);
    }
  };
  recurse(content?.suites ?? []);
  return { suiteKeys, caseKeys };
}

/**
 * Validate raw (already JSON.parse'd) content.
 *
 * @returns {{ok: true, content: object} | {ok: false, errors: string[]}}
 */
export function parseTemplateContent(raw) {
  const errors = [];
  const push = (where, msg) => errors.push(`${where}: ${msg}`);

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ["content: expected an object"] };
  }

  // Size is checked on the serialised form because that is what the column
  // stores and what an attacker controls.
  let serialised = "";
  try {
    serialised = JSON.stringify(raw);
  } catch {
    return { ok: false, errors: ["content: not serialisable (circular?)"] };
  }
  if (serialised.length > LIMITS.bytes) {
    push("content", `too large (${serialised.length} > ${LIMITS.bytes} bytes)`);
  }

  // --- variables -----------------------------------------------------------
  const declared = new Set();
  const variables = [];
  if (raw.variables !== undefined) {
    if (!Array.isArray(raw.variables)) {
      push("variables", "expected an array");
    } else {
      raw.variables.forEach((v, i) => {
        const at = `variables[${i}]`;
        if (!isPlainObject(v)) return push(at, "expected an object");
        if (!VAR_KEY_RE.test(String(v.key ?? ""))) {
          return push(at, `invalid key ${JSON.stringify(v.key)} (want ^[A-Z][A-Z0-9_]{0,30}$)`);
        }
        if (declared.has(v.key)) return push(at, `duplicate variable ${v.key}`);
        if (!isNonEmptyString(v.label)) return push(at, "label is required");
        if (typeof v.default !== "string") return push(at, "default must be a string");
        declared.add(v.key);
        variables.push({ key: v.key, label: v.label.trim(), default: v.default });
      });
    }
  }

  // Collected so an undeclared {{VAR}} names the field it appeared in.
  const varRefs = [];
  const checkText = (text, where) => {
    for (const name of referencedVariables(text)) varRefs.push({ name, where });
  };

  // --- suites / cases ------------------------------------------------------
  let suiteCount = 0;
  let caseCount = 0;
  const seenCaseKeys = new Set();

  const parseCase = (rawCase, at, siblingKeys) => {
    if (!isPlainObject(rawCase)) {
      push(at, "expected an object");
      return null;
    }
    caseCount++;

    const key = String(rawCase.key ?? "");
    if (!KEY_RE.test(key)) {
      push(at, `invalid key ${JSON.stringify(rawCase.key)} (want ^[a-z0-9][a-z0-9-]{0,48}$)`);
    } else if (siblingKeys.has(key)) {
      push(at, `duplicate case key ${key} in this suite`);
    } else {
      siblingKeys.add(key);
    }
    // Selection travels over the wire as a flat list of case keys, so a key
    // that repeats anywhere in the template would make one checkbox select two
    // cases. Unique per suite is not enough — it has to be unique per template.
    if (key && seenCaseKeys.has(key)) {
      push(at, `case key ${key} is already used elsewhere in this template`);
    }
    if (key) seenCaseKeys.add(key);

    if (!isNonEmptyString(rawCase.title)) push(at, "title is required");
    checkText(rawCase.title, `${at}.title`);

    if (!COVERAGE_KINDS.includes(rawCase.coverage)) {
      push(at, `coverage ${JSON.stringify(rawCase.coverage)} is not one of ${COVERAGE_KINDS.join(", ")}`);
    }
    if (!TEMPLATE_PRIORITIES.includes(rawCase.priority)) {
      push(at, `priority ${JSON.stringify(rawCase.priority)} is not one of ${TEMPLATE_PRIORITIES.join(", ")}`);
    }
    if (!TEMPLATE_CASE_TYPES.includes(rawCase.type)) {
      push(at, `type ${JSON.stringify(rawCase.type)} is not one of ${TEMPLATE_CASE_TYPES.join(", ")}`);
    }

    for (const field of ["preconditions", "expectedResult"]) {
      const v = rawCase[field];
      if (v !== undefined && typeof v !== "string") push(at, `${field} must be a string`);
      checkText(v, `${at}.${field}`);
    }

    const steps = [];
    if (!Array.isArray(rawCase.steps)) {
      push(at, "steps must be an array");
    } else if (rawCase.steps.length > LIMITS.stepsPerCase) {
      push(at, `too many steps (${rawCase.steps.length} > ${LIMITS.stepsPerCase})`);
    } else {
      rawCase.steps.forEach((s, i) => {
        if (!isPlainObject(s) || !isNonEmptyString(s.action)) {
          return push(`${at}.steps[${i}]`, "action is required");
        }
        if (s.expected !== undefined && typeof s.expected !== "string") {
          return push(`${at}.steps[${i}]`, "expected must be a string");
        }
        checkText(s.action, `${at}.steps[${i}].action`);
        checkText(s.expected, `${at}.steps[${i}].expected`);
        steps.push({ action: s.action, expected: s.expected ?? "" });
      });
    }

    const tags = [];
    if (rawCase.tags !== undefined) {
      if (!Array.isArray(rawCase.tags)) push(at, "tags must be an array of strings");
      else {
        for (const t of rawCase.tags) {
          if (typeof t !== "string") push(at, "tags must be an array of strings");
          // Commas are the separator in TestCase.tags — a tag containing one
          // would silently become two.
          else if (t.includes(",")) push(at, `tag ${JSON.stringify(t)} may not contain a comma`);
          else if (t.trim()) tags.push(t.trim());
        }
      }
    }

    if (rawCase.estimateSeconds !== undefined) {
      const n = rawCase.estimateSeconds;
      if (!Number.isInteger(n) || n < 0) push(at, "estimateSeconds must be a non-negative integer");
    }

    return {
      key,
      title: String(rawCase.title ?? "").trim(),
      coverage: rawCase.coverage,
      priority: rawCase.priority,
      type: rawCase.type,
      preconditions: rawCase.preconditions ?? "",
      steps,
      expectedResult: rawCase.expectedResult ?? "",
      tags,
      ...(rawCase.estimateSeconds !== undefined
        ? { estimateSeconds: rawCase.estimateSeconds }
        : {}),
    };
  };

  const parseSuites = (list, at, depth, siblingKeys) => {
    if (!Array.isArray(list)) {
      push(at, "expected an array");
      return [];
    }
    if (depth > LIMITS.depth) {
      push(at, `nested deeper than ${LIMITS.depth} levels`);
      return [];
    }
    const out = [];
    list.forEach((rawSuite, i) => {
      const here = `${at}[${i}]`;
      if (!isPlainObject(rawSuite)) {
        push(here, "expected an object");
        return;
      }
      suiteCount++;

      const key = String(rawSuite.key ?? "");
      if (!KEY_RE.test(key)) {
        push(here, `invalid key ${JSON.stringify(rawSuite.key)} (want ^[a-z0-9][a-z0-9-]{0,48}$)`);
      } else if (siblingKeys.has(key)) {
        push(here, `duplicate suite key ${key}`);
      } else {
        siblingKeys.add(key);
      }

      if (!isNonEmptyString(rawSuite.name)) push(here, "name is required");
      checkText(rawSuite.name, `${here}.name`);
      if (rawSuite.description !== undefined && typeof rawSuite.description !== "string") {
        push(here, "description must be a string");
      }
      checkText(rawSuite.description, `${here}.description`);

      const caseKeys = new Set();
      const cases = [];
      if (rawSuite.cases !== undefined) {
        if (!Array.isArray(rawSuite.cases)) push(`${here}.cases`, "expected an array");
        else {
          rawSuite.cases.forEach((c, ci) => {
            const parsed = parseCase(c, `${here}.cases[${ci}]`, caseKeys);
            if (parsed) cases.push(parsed);
          });
        }
      }

      const childKeys = new Set();
      const children = rawSuite.suites !== undefined
        ? parseSuites(rawSuite.suites, `${here}.suites`, depth + 1, childKeys)
        : [];

      out.push({
        key,
        name: String(rawSuite.name ?? "").trim(),
        description: rawSuite.description ?? "",
        cases,
        suites: children,
      });
    });
    return out;
  };

  const rootKeys = new Set();
  const suites = parseSuites(raw.suites, "suites", 1, rootKeys);

  if (suiteCount === 0) push("suites", "a template needs at least one suite");
  if (suiteCount > LIMITS.suites) push("suites", `too many suites (${suiteCount} > ${LIMITS.suites})`);
  if (caseCount === 0) push("suites", "a template needs at least one case");
  if (caseCount > LIMITS.cases) push("suites", `too many cases (${caseCount} > ${LIMITS.cases})`);

  // Checked last so the error names every offending field at once rather than
  // one per run of the validator.
  for (const { name, where } of varRefs) {
    if (!declared.has(name)) push(where, `uses {{${name}}}, which is not declared in variables`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, content: { variables, suites } };
}
