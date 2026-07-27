// F-39: regression guard for the theme token system. Walks src/**/*.tsx and
// fails on any raw Tailwind palette colour, bg-white, or a dark: variant —
// all colour must resolve from the token layer in src/app/globals.css so both
// themes stay tuned from one place. Run via `npm run check:theme` (wired into
// CI before the build step).
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const PALETTE =
  "slate|gray|zinc|neutral|stone|indigo|violet|purple|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|fuchsia|pink";
const UTILITY =
  "bg|text|border|ring|divide|placeholder|from|via|to|outline|decoration|caret|accent|fill|stroke";

const RULES = [
  { re: new RegExp(`\\b(${UTILITY})-(${PALETTE})-\\d{2,3}\\b`, "g"), label: "raw palette colour" },
  { re: /\bbg-white\b/g, label: "bg-white" },
  { re: /\bdark:/g, label: "dark: variant" },
];

// Exact paths only — each entry documents why it is exempt.
const ALLOWLIST = new Set([
  "src/lib/result-statuses.ts", // status hexes are per-project data, not theme
  "src/app/print/print.css", // paper is always light (§7.6)
]);

// NOTE: git's `**` pathspec glob requires an intermediate directory segment
// and silently skips top-level files (e.g. src/components/icons.tsx) — list
// everything under src/ and filter by extension instead (see also the WP-7
// codemod scripts, which hit the same trap).
const files = execSync('git ls-files -- src', { encoding: "utf8" })
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => f.endsWith(".tsx"))
  .filter((f) => !ALLOWLIST.has(f));

let violations = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    for (const { re, label } of RULES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        console.error(`${file}:${i + 1}: ${label}: ${m[0]}`);
        violations++;
      }
    }
  });
}

if (violations > 0) {
  console.error(`\ncheck-theme-tokens: ${violations} violation(s) found.`);
  process.exit(1);
}
console.log("check-theme-tokens: OK");
