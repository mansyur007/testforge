// §7.1 guard: a track that names the certification scheme must carry the
// non-affiliation notice on its own pages.
//
// The notice is one constant (`ISTQB_DISCLAIMER`) and A-06 rendered it on every
// page that named the scheme at the time: the roadmap, the two exam routes and
// the certificate. What it did not cover is `/academy/[track]` and
// `/academy/[track]/[lesson]` — invisible so far, because T5 is a draft and
// both routes 404 for it. The day its lessons publish, six lesson pages and a
// track page that name ISTQB throughout would have gone live without the
// notice, and nothing in the build would have said so.
//
// `Track.trademarkNotice` is what the two pages now render on, and this is what
// makes forgetting it a build failure rather than a legal problem discovered
// later. Same move as A-10e's syllabus guards: make the class of error
// unrepresentable rather than remembering to check.
//
// **What it reads.** Track source files, as text. The tracks are TypeScript
// modules with imports and a directory-per-track layout, so loading them under
// bare `node` (the way `academy-bank-check.mjs` loads the question files) would
// mean resolving a dozen lesson modules per track; the property being checked
// is coarse enough that scanning the source is both sufficient and harder to
// break. Comment lines are stripped first, so a `// see docs/QA-ACADEMY.md §7`
// note in a file does not trip it.
//
// **What it does not check:** that the pages render the notice — that is what
// the component and its `data-testid` are for. This guards the content half,
// which is the half that changes every time somebody writes a lesson.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TRACKS_DIR = "src/content/academy/tracks";
const SCHEME = /ISTQB|CTFL/;

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Every .ts file belonging to one track: either `slug.ts` or `slug/*.ts`. */
function trackFiles() {
  const byTrack = new Map();
  for (const entry of readdirSync(TRACKS_DIR)) {
    const path = join(TRACKS_DIR, entry);
    if (statSync(path).isDirectory()) {
      byTrack.set(
        entry,
        readdirSync(path)
          .filter((f) => f.endsWith(".ts"))
          .map((f) => join(path, f)),
      );
    } else if (entry.endsWith(".ts")) {
      byTrack.set(entry.replace(/\.ts$/, ""), [path]);
    }
  }
  return byTrack;
}

/** Source with `//` comment lines and block comments removed. */
function withoutComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join("\n");
}

const tracks = trackFiles();
assert("tracks directory is not empty", tracks.size > 0);

let namesScheme = 0;
for (const [slug, files] of tracks) {
  const sources = files.map((f) => ({ f, src: readFileSync(f, "utf8") }));
  const mentions = sources.filter(({ src }) => SCHEME.test(withoutComments(src)));
  if (mentions.length === 0) continue;

  namesScheme++;
  // The flag lives on the Track object, which is in the track's index (or its
  // single file). Text match rather than a parse: it is a literal boolean.
  const index =
    sources.find(({ f }) => /(?:^|[\\/])index\.ts$/.test(f)) ?? sources[0];
  assert(
    `track "${slug}" names the certification scheme and must set trademarkNotice`,
    /trademarkNotice:\s*true/.test(index.src),
    `mentioned in ${mentions.map((m) => m.f).join(", ")}; expected trademarkNotice: true in ${index.f}`,
  );
}

assert(
  "at least one track names the scheme",
  namesScheme > 0,
  "the guard found nothing to guard, which means it has stopped working",
);

if (failed) {
  console.error(`academy-trademark-check: ${failed} failure(s)`);
  process.exit(1);
}
console.log(
  `academy-trademark-check: OK (${tracks.size} tracks, ${namesScheme} naming the scheme, all carrying the notice)`,
);
