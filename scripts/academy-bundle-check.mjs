// A-02: proves the Academy answer key never ships to the browser.
//
// Two mechanisms guard that boundary. `src/content/academy/index.ts` and
// `src/lib/academy/questions.ts` are `server-only`, so importing them from a
// client component fails the build — that is the primary defence. This script is
// the second: it reads the explanations straight out of the lesson sources and
// greps the built *client* chunks for them. If a refactor ever finds a way past
// `server-only` (a re-export, a barrel file, a "use client" added to the wrong
// component), the text shows up in a chunk and this fails the build.
//
// Explanations are the canary rather than the `correct` flags because a boolean
// survives minification as `!0` and is indistinguishable from any other boolean;
// a sentence of English is not.
//
// Runs as `postbuild`, so `npm run build` covers it with no CI change.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = "src/content/academy";
const CHUNKS_DIR = ".next/static/chunks";
/** Enough text to be unique, short enough to survive line breaks in source. */
const CANARY_LENGTH = 40;

function walk(dir, match, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, match, out);
    else if (match(entry)) out.push(full);
  }
  return out;
}

function canaries() {
  const found = [];
  for (const file of walk(CONTENT_DIR, (f) => f.endsWith(".ts"))) {
    const src = readFileSync(file, "utf8");
    // `explanation: "…"`, allowing escaped quotes inside.
    for (const m of src.matchAll(/explanation:\s*"((?:[^"\\]|\\.)*)"/g)) {
      const text = m[1].replace(/\\"/g, '"');
      if (text.length >= CANARY_LENGTH) {
        found.push({ file, text: text.slice(0, CANARY_LENGTH) });
      }
    }
  }
  return found;
}

const expected = canaries();
if (expected.length === 0) {
  // No questions written yet is fine; silently passing once questions exist but
  // the regex stopped matching them is not, so say which case this is.
  console.log("academy-bundle-check: no explanations in content yet — nothing to check");
  process.exit(0);
}

if (!existsSync(CHUNKS_DIR)) {
  console.error(`academy-bundle-check: ${CHUNKS_DIR} is missing — run after \`next build\``);
  process.exit(1);
}

const chunks = walk(CHUNKS_DIR, (f) => f.endsWith(".js"));
const leaks = [];
for (const chunk of chunks) {
  const js = readFileSync(chunk, "utf8");
  for (const c of expected) {
    if (js.includes(c.text)) leaks.push({ chunk, ...c });
  }
}

if (leaks.length > 0) {
  console.error("academy-bundle-check: ANSWER KEY LEAKED INTO CLIENT BUNDLE");
  for (const l of leaks) {
    console.error(`  ${l.chunk}\n    from ${l.file}\n    "${l.text}…"`);
  }
  process.exit(1);
}

console.log(
  `academy-bundle-check: OK (${expected.length} explanations, ${chunks.length} client chunks, 0 leaks)`,
);
