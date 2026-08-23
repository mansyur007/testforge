// F-46: regression guard for the palette system. A palette lives in two
// files at once — the registry in src/lib/theme.ts (labels, preview swatches)
// and the token block in src/app/globals.css (what the app actually wears) —
// and a half-added palette fails silently: the card renders, clicking it does
// nothing visible, because the CSS block it selects does not exist.
//
// Three checks:
//   1. every id in PALETTE_IDS has both CSS blocks (light and dark), except
//      `violet` (which IS :root/.dark) and `custom` (derived at runtime);
//   2. no CSS block exists for an id the registry does not know;
//   3. every palette block overrides the full accent ramp — a palette that
//      sets --tf-accent but forgets --tf-accent-soft looks broken only on the
//      few screens that use chips.
// Run via `npm run check:theme`, alongside check-theme-tokens.mjs.
import { readFileSync } from "node:fs";

const theme = readFileSync("src/lib/theme.ts", "utf8");
// Comments are stripped first: the block above the palettes in globals.css
// explains the selectors by quoting them, and check 2 would otherwise read
// that prose as a palette named "x".
const css = readFileSync("src/app/globals.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// The registry is TypeScript; this script is plain node. Reading the ids out
// of the source beats compiling it — the array is a literal by design.
const idBlock = theme.match(/export const PALETTE_IDS = \[([\s\S]*?)\] as const;/);
if (!idBlock) {
  console.error("check-palettes: could not find PALETTE_IDS in src/lib/theme.ts");
  process.exit(1);
}
const ids = [...idBlock[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);

// `violet` is the base block, `custom` is derived in JS: neither has CSS.
const CSS_LESS = new Set(["violet", "custom"]);
const ACCENT_TOKENS = [
  "--tf-accent",
  "--tf-accent-hover",
  "--tf-accent-fg",
  "--tf-accent-text",
  "--tf-accent-soft",
  "--tf-accent-soft-fg",
  "--tf-accent-ring",
];

let problems = 0;
const fail = (msg) => {
  console.error(`check-palettes: ${msg}`);
  problems++;
};

function block(selector) {
  const start = css.indexOf(selector + " {");
  if (start === -1) return null;
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

for (const id of ids) {
  if (CSS_LESS.has(id)) continue;
  for (const selector of [`[data-palette="${id}"]:not(.dark)`, `.dark[data-palette="${id}"]`]) {
    const body = block(selector);
    if (!body) {
      fail(`palette "${id}" is in PALETTE_IDS but has no \`${selector}\` block in globals.css`);
      continue;
    }
    for (const token of ACCENT_TOKENS) {
      if (!new RegExp(`${token}:`).test(body)) {
        fail(`\`${selector}\` does not set ${token} — the accent ramp must be complete`);
      }
    }
  }
}

for (const match of css.matchAll(/\[data-palette="([a-z]+)"\]/g)) {
  if (!ids.includes(match[1])) {
    fail(`globals.css styles palette "${match[1]}", which is not in PALETTE_IDS`);
  }
}

if (problems > 0) {
  console.error(`\ncheck-palettes: ${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`check-palettes: OK (${ids.length} palettes)`);
