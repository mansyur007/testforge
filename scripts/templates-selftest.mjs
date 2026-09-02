// F-47: unit tests for the template content validator, plus two guards that
// only a script can enforce — vocabulary drift against `src/lib/constants.ts`,
// and the content rule that no suite in a built-in pack may be positive-only.
//
// Runs against `src/lib/templates/content-core.mjs` directly — no database, no
// Next runtime, no TS — same shape as `scripts/academy-exam-selftest.mjs`, and
// wired into `prebuild` so `npm run build` covers it with no CI change.
import { readFileSync } from "node:fs";
import {
  COVERAGE_KINDS,
  LIMITS,
  TEMPLATE_CASE_TYPES,
  TEMPLATE_PRIORITIES,
  countPruned,
  countTemplate,
  coverageBreakdown,
  parseTemplateContent,
  pruneToSelection,
  selectAll,
  substituteVariables,
} from "../src/lib/templates/content-core.mjs";
import { BUILT_IN_TEMPLATES } from "../src/content/templates/index.mjs";

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** A minimal valid template, for tests that mutate one thing at a time. */
function validContent(overrides = {}) {
  return {
    suites: [
      {
        key: "login",
        name: "Login",
        cases: [
          {
            key: "happy",
            title: "Sign in with valid credentials",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            steps: [{ action: "Submit the form", expected: "Signed in" }],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Assert the parse failed, and that some error mentions `needle`. */
function assertRejects(name, content, needle) {
  const r = parseTemplateContent(content);
  if (r.ok) return assert(name, false, "expected a rejection, got ok");
  const hit = r.errors.some((e) => e.toLowerCase().includes(needle.toLowerCase()));
  assert(name, hit, `no error mentioned "${needle}"; got: ${r.errors.join(" | ")}`);
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

{
  const r = parseTemplateContent(validContent());
  assert("accepts a minimal valid template", r.ok, r.ok ? "" : r.errors.join(" | "));
  if (r.ok) {
    assert("normalises absent optional fields", r.content.suites[0].cases[0].preconditions === "");
    assert("defaults variables to an empty array", Array.isArray(r.content.variables) && r.content.variables.length === 0);
    assert("normalises an absent step `expected`", r.content.suites[0].cases[0].steps[0].expected === "Signed in");
  }
}

// ---------------------------------------------------------------------------
// Enum validation
// ---------------------------------------------------------------------------

{
  const bad = validContent();
  bad.suites[0].cases[0].priority = "URGENT";
  assertRejects("rejects a priority outside PRIORITIES", bad, "priority");
}
{
  const bad = validContent();
  bad.suites[0].cases[0].type = "MANUAL";
  assertRejects("rejects a type outside CASE_TYPES", bad, "type");
}
{
  const bad = validContent();
  bad.suites[0].cases[0].coverage = "smoke";
  assertRejects("rejects a coverage outside the taxonomy", bad, "coverage");
}
{
  const bad = validContent();
  delete bad.suites[0].cases[0].coverage;
  assertRejects("requires a coverage tag on every case", bad, "coverage");
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

{
  const bad = validContent();
  bad.suites[0].cases[0].key = "Not A Key";
  assertRejects("rejects a malformed case key", bad, "invalid key");
}
{
  const bad = validContent();
  bad.suites[0].cases.push({ ...bad.suites[0].cases[0] });
  assertRejects("rejects duplicate case keys within a suite", bad, "duplicate case key");
}
{
  // Selection travels as a flat list of case keys, so a repeat anywhere in the
  // template would make one checkbox select two cases.
  const bad = validContent();
  bad.suites.push({
    key: "other",
    name: "Other",
    cases: [{ ...bad.suites[0].cases[0] }],
  });
  assertRejects("rejects a case key reused in another suite", bad, "already used elsewhere");
}
{
  const bad = validContent();
  bad.suites.push({ key: "login", name: "Login again", cases: [] });
  assertRejects("rejects duplicate sibling suite keys", bad, "duplicate suite key");
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

{
  const bad = validContent();
  bad.suites[0].cases[0].title = "Create a {{ENTITY}}";
  assertRejects("rejects an undeclared {{VAR}}", bad, "not declared");
}
{
  const good = validContent({
    variables: [{ key: "ENTITY", label: "Entity", default: "Item" }],
  });
  good.suites[0].cases[0].title = "Create a {{ENTITY}}";
  good.suites[0].cases[0].steps[0].action = "Open the {{ENTITY}} form";
  const r = parseTemplateContent(good);
  assert("accepts a declared {{VAR}}", r.ok, r.ok ? "" : r.errors.join(" | "));
}
{
  const bad = validContent({
    variables: [{ key: "lowercase", label: "Nope", default: "x" }],
  });
  assertRejects("rejects a lowercase variable key", bad, "invalid key");
}
{
  // A {{VAR}} inside a step must be caught too, not just in the title.
  const bad = validContent();
  bad.suites[0].cases[0].steps[0].expected = "The {{THING}} is saved";
  assertRejects("checks {{VAR}} references inside steps", bad, "not declared");
}

// ---------------------------------------------------------------------------
// Structure limits
// ---------------------------------------------------------------------------

{
  const bad = { suites: [] };
  assertRejects("rejects a template with no suites", bad, "at least one suite");
}
{
  const bad = { suites: [{ key: "empty", name: "Empty" }] };
  assertRejects("rejects a template with no cases", bad, "at least one case");
}
{
  // depth 4: root > a > b > c
  const deep = {
    suites: [
      {
        key: "a", name: "A",
        suites: [
          {
            key: "b", name: "B",
            suites: [
              {
                key: "c", name: "C",
                suites: [{ key: "d", name: "D", cases: [] }],
                cases: [],
              },
            ],
            cases: [],
          },
        ],
        cases: [
          {
            key: "k", title: "T", coverage: "positive", priority: "LOW",
            type: "FUNCTIONAL", steps: [],
          },
        ],
      },
    ],
  };
  assertRejects("rejects nesting deeper than the limit", deep, "nested deeper");
}
{
  const bad = validContent();
  bad.suites[0].cases[0].steps = Array.from({ length: LIMITS.stepsPerCase + 1 }, () => ({
    action: "step", expected: "ok",
  }));
  assertRejects("rejects a case with too many steps", bad, "too many steps");
}
{
  const bad = { suites: [] };
  for (let i = 0; i <= LIMITS.cases; i++) {
    bad.suites.push({
      key: `s${i}`, name: `S${i}`,
      cases: [{
        key: `c${i}`, title: "T", coverage: "positive", priority: "LOW",
        type: "FUNCTIONAL", steps: [],
      }],
    });
  }
  assertRejects("rejects more cases than the cap", bad, "too many");
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

{
  // TestCase.tags is comma-separated, so a comma inside a tag becomes two tags.
  const bad = validContent();
  bad.suites[0].cases[0].tags = ["smoke,regression"];
  assertRejects("rejects a tag containing a comma", bad, "comma");
}

// ---------------------------------------------------------------------------
// substituteVariables
// ---------------------------------------------------------------------------

{
  assert(
    "substitutes a declared variable",
    substituteVariables("Create a {{ENTITY}}", { ENTITY: "Invoice" }) === "Create a Invoice",
  );
  assert(
    "substitutes every occurrence",
    substituteVariables("{{A}}-{{A}}", { A: "x" }) === "x-x",
  );
  assert(
    "tolerates whitespace inside the braces",
    substituteVariables("{{ ENTITY }}", { ENTITY: "Order" }) === "Order",
  );
  assert(
    "never leaves an unresolved placeholder in user data",
    substituteVariables("a {{MISSING}} b", {}) === "a  b",
  );
}

// ---------------------------------------------------------------------------
// Selection pruning
// ---------------------------------------------------------------------------

// A two-level tree: parent "auth" holds case "a1" and child suite "login",
// which holds "l1" and "l2".
function tree() {
  const r = parseTemplateContent({
    suites: [
      {
        key: "auth",
        name: "Auth",
        cases: [{ key: "a1", title: "A1", coverage: "positive", priority: "LOW", type: "FUNCTIONAL", steps: [] }],
        suites: [
          {
            key: "login",
            name: "Login",
            cases: [
              { key: "l1", title: "L1", coverage: "positive", priority: "LOW", type: "FUNCTIONAL", steps: [] },
              { key: "l2", title: "L2", coverage: "negative", priority: "LOW", type: "FUNCTIONAL", steps: [] },
            ],
          },
        ],
      },
    ],
  });
  if (!r.ok) throw new Error(`fixture invalid: ${r.errors.join(" | ")}`);
  return r.content;
}

{
  const content = tree();
  const all = selectAll(content);
  assert("selectAll picks up every suite", all.suiteKeys.length === 2);
  assert("selectAll picks up every case", all.caseKeys.length === 3);

  const full = countPruned(pruneToSelection(content.suites, all));
  assert("select-all keeps the whole tree", full.suites === 2 && full.cases === 3);
}

{
  // The orphan rule: a case is checked but neither its suite nor its ancestor
  // is. Both suites must still be created or the case has nowhere to land.
  const content = tree();
  const pruned = pruneToSelection(content.suites, { suiteKeys: [], caseKeys: ["l2"] });
  const { suites, cases } = countPruned(pruned);
  assert("an unchecked ancestor is kept when a descendant case is checked", suites === 2, `got ${suites}`);
  assert("only the checked case survives", cases === 1, `got ${cases}`);
  assert("the surviving case is the checked one", pruned[0]?.children[0]?.cases[0]?.key === "l2");
  assert("the ancestor keeps none of its own unchecked cases", pruned[0]?.cases.length === 0);
}

{
  // Unchecking a whole branch drops it entirely.
  const content = tree();
  const pruned = pruneToSelection(content.suites, {
    suiteKeys: ["auth"],
    caseKeys: ["a1"],
  });
  const { suites, cases } = countPruned(pruned);
  assert("an unselected child suite is dropped", suites === 1, `got ${suites}`);
  assert("only the parent's own case survives", cases === 1, `got ${cases}`);
}

{
  // A suite checked with none of its cases is still created — an empty suite is
  // a legitimate thing to want out of a template.
  const content = tree();
  const pruned = pruneToSelection(content.suites, { suiteKeys: ["auth"], caseKeys: [] });
  const { suites, cases } = countPruned(pruned);
  assert("a checked suite with no checked cases is still created", suites === 1 && cases === 0);
}

{
  const content = tree();
  const pruned = pruneToSelection(content.suites, { suiteKeys: [], caseKeys: [] });
  assert("an empty selection prunes to nothing", countPruned(pruned).suites === 0);
}

// ---------------------------------------------------------------------------
// Vocabulary drift guard
// ---------------------------------------------------------------------------
//
// `content-core.mjs` keeps its own copies of PRIORITIES and CASE_TYPES because
// it must run under bare node and `constants.ts` is TypeScript. This is the
// guard that makes the duplication safe: add a CASE_TYPE and forget the copy,
// and the build fails here rather than every template silently rejecting it.

{
  const src = readFileSync("src/lib/constants.ts", "utf8");
  const arrayFromTs = (name) => {
    const m = src.match(new RegExp(`export const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`));
    if (!m) return null;
    // [A-Z0-9_] — not [A-Z_]. "E2E" has a digit in it, and a stricter class
    // silently drops it, which reads as drift rather than as a broken matcher.
    return [...m[1].matchAll(/"([A-Z0-9_]+)"/g)].map((x) => x[1]);
  };

  const priorities = arrayFromTs("PRIORITIES");
  assert("drift guard: found PRIORITIES in constants.ts", priorities !== null);
  if (priorities) {
    assert(
      "TEMPLATE_PRIORITIES matches constants.ts PRIORITIES",
      JSON.stringify(priorities) === JSON.stringify(TEMPLATE_PRIORITIES),
      `constants.ts=${priorities.join(",")} core=${TEMPLATE_PRIORITIES.join(",")}`,
    );
  }

  const types = arrayFromTs("CASE_TYPES");
  assert("drift guard: found CASE_TYPES in constants.ts", types !== null);
  if (types) {
    assert(
      "TEMPLATE_CASE_TYPES matches constants.ts CASE_TYPES",
      JSON.stringify(types) === JSON.stringify(TEMPLATE_CASE_TYPES),
      `constants.ts=${types.join(",")} core=${TEMPLATE_CASE_TYPES.join(",")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// The built-in packs
// ---------------------------------------------------------------------------

{
  const slugs = new Set();
  for (const pack of BUILT_IN_TEMPLATES) {
    const where = `pack "${pack.slug}"`;

    assert(`${where}: has a slug`, typeof pack.slug === "string" && pack.slug.length > 0);
    assert(`${where}: slug is unique`, !slugs.has(pack.slug));
    slugs.add(pack.slug);
    assert(`${where}: has a name`, typeof pack.name === "string" && pack.name.length > 0);
    assert(`${where}: has a summary for the gallery card`, typeof pack.summary === "string" && pack.summary.length > 0);

    const r = parseTemplateContent(pack.content);
    assert(`${where}: content is valid`, r.ok, r.ok ? "" : r.errors.join(" | "));
    if (!r.ok) continue;

    const { suites, cases } = countTemplate(r.content);
    assert(`${where}: has suites and cases`, suites > 0 && cases > 0);

    // The rule the whole feature rests on. A pack that only demonstrates the
    // happy path teaches exactly the habit F-47 exists to break, so this is
    // enforced per suite rather than per pack — an overall ratio would let one
    // rich suite hide four positive-only ones.
    const walkSuites = (list, path) => {
      for (const s of list) {
        const here = [...path, s.name].join(" > ");
        if ((s.cases ?? []).length > 0) {
          const kinds = new Set(s.cases.map((c) => c.coverage));
          assert(
            `${where}: suite "${here}" is not positive-only`,
            !(kinds.size === 1 && kinds.has("positive")),
            `${s.cases.length} case(s), all positive`,
          );
        }
        walkSuites(s.suites ?? [], [...path, s.name]);
      }
    };
    walkSuites(r.content.suites, []);

    // Every case needs steps to be worth applying; an empty-step case is a
    // title someone still has to write.
    const emptySteps = [];
    const collect = (list) => {
      for (const s of list) {
        for (const c of s.cases ?? []) if (c.steps.length === 0) emptySteps.push(c.key);
        collect(s.suites ?? []);
      }
    };
    collect(r.content.suites);
    assert(`${where}: every case has at least one step`, emptySteps.length === 0, emptySteps.join(", "));

    // Surfaced so a thin pack is visible in the build log, not just in the UI.
    const breakdown = coverageBreakdown(r.content);
    const shown = COVERAGE_KINDS.filter((k) => breakdown[k] > 0)
      .map((k) => `${k}=${breakdown[k]}`)
      .join(" ");
    console.log(`  ${pack.slug}: ${suites} suites, ${cases} cases — ${shown}`);
  }
}

if (failed) {
  console.error(`\ntemplates-selftest: ${failed} check(s) failed`);
  process.exit(1);
}
console.log("templates-selftest: OK");
