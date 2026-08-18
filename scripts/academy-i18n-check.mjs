// A-08: build guard for the Indonesian Academy content.
//
// A-08's translation half lands one track at a time over several PRs, and every
// intermediate state is a *partly* translated Academy. That is the shape this
// script exists for: the failure modes are all quiet ones, and every one of
// them ships a page rather than an error.
//
// What it asserts, and why each one is a real thing that goes wrong:
//
// 1. **Every translated slug names a real published lesson.** A typo'd slug in
//    the Indonesian tree is not a compile error — `visibleLessons` intersects
//    the two lists, so the lesson simply never appears in Indonesian and the
//    translation sits in the repo doing nothing. Silent under-delivery.
//
// 2. **Question ids and choice ids match the English question exactly.** The
//    answer key lives only in English (`QuestionTranslation` has no `correct`),
//    and `localiseQuestion` merges by id. A renamed choice id therefore does not
//    break — it falls back to the English text for that one option, which is a
//    single untranslated line in an otherwise Indonesian quiz and is very easy
//    to miss in review.
//
// 3. **No Indonesian body links to `/academy/`.** A translated lesson linking
//    to an English one drops the reader out of their language mid-sentence, and
//    it is the single easiest mistake to make when translating: the links are
//    already in the source text and copy across unchanged.
//
// 4. **The two ISTQB disclaimers both exist and differ.** §7.1 requires the
//    notice on every page naming the scheme; an Indonesian page carrying the
//    English paragraph meets the letter and not the point. Asserting they
//    *differ* catches the specific lazy fix of aliasing one to the other.
//
// 5. **Track-level copy is translated whenever any of its lessons are.** A
//    track page with Indonesian lessons and an English title/tagline is the
//    half-done state that looks finished.
//
// 6. **The self-check grader resolves questions in the reader's language.**
//    The page sanitizes the *localised* questions, but grading is a second,
//    separate lookup in `gradeSelfCheck`, and it originally used the English
//    registry. Nothing about that is visible until you answer a question: the
//    stem and choices are Indonesian, the verdict is right, and the
//    explanation underneath it is a paragraph of English. Every translated
//    `explanation` in this tree was dead text. Asserted here because it is
//    unreachable from the content files — it is a code path, and it is the
//    only one that can make correct translations never render.
//
// Reads the TypeScript as text, the way `academy-checks-selftest.mjs` reads
// `sandbox.ts` and `academy-trademark-check.mjs` reads the track files: these
// are data modules with a fixed shape, and parsing them beats maintaining a
// second copy of what they contain. Wired into `prebuild` next to its siblings.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const EN_TRACKS = "src/content/academy/tracks";
const ID_TRACKS = "src/content/academy/translations/id";

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Strip line and block comments so a `// see /academy/x` note in a file does
 *  not trip the link rule, the same way the trademark check does it. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** `slug: "x"` at the top level of an exported object literal. */
function slugOf(src) {
  const m = src.match(/^\s{2}slug:\s*"([a-z0-9-]+)"/m);
  return m ? m[1] : null;
}

/** Every `{ id: "..." }` inside a `selfCheck` array, as
 *  `[questionId, [choiceId, ...]]` pairs, in source order. */
function selfCheckShape(src) {
  const at = src.indexOf("selfCheck:");
  if (at === -1) return [];
  const body = src.slice(at);
  const questions = [];
  // Question ids sit at a known indentation inside the lesson object; choice
  // ids only ever appear inside a `choices: [...]` array. Slicing per question
  // keeps the two from being confused with each other.
  const qSplit = body.split(/^\s{4}\{\s*$/m).slice(1);
  for (const chunk of qSplit) {
    const qid = chunk.match(/^\s{6}id:\s*"([^"]+)"/m);
    if (!qid) continue;
    const choicesAt = chunk.indexOf("choices:");
    const choices = choicesAt === -1
      ? []
      : [...chunk.slice(choicesAt).matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]);
    questions.push([qid[1], choices]);
  }
  return questions;
}

/** Lesson files of one track directory, as `{ slug, src, file }`. */
function lessonFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => {
      const src = readFileSync(join(dir, f), "utf8");
      return { file: join(dir, f), src, slug: slugOf(src) };
    });
}

// ---------------------------------------------------------------------------

const enByTrack = new Map();
for (const track of readdirSync(EN_TRACKS)) {
  const dir = join(EN_TRACKS, track);
  if (!statSync(dir).isDirectory()) continue;
  const bySlug = new Map();
  for (const l of lessonFiles(dir)) {
    if (!l.slug) continue;
    const published = /status:\s*"published"/.test(l.src);
    bySlug.set(l.slug, { ...l, published, shape: selfCheckShape(l.src) });
  }
  enByTrack.set(track, bySlug);
}

const idTrackDirs = existsSync(ID_TRACKS)
  ? readdirSync(ID_TRACKS).filter((f) => statSync(join(ID_TRACKS, f)).isDirectory())
  : [];

let translatedLessons = 0;
const perTrack = [];

for (const track of idTrackDirs) {
  const en = enByTrack.get(track);
  assert(
    `id/${track} translates a track that exists in English`,
    Boolean(en),
    `no ${join(EN_TRACKS, track)}`,
  );
  if (!en) continue;

  const idxPath = join(ID_TRACKS, track, "index.ts");
  assert(`id/${track} has an index.ts with the track's own copy`, existsSync(idxPath));

  const lessons = lessonFiles(join(ID_TRACKS, track));
  translatedLessons += lessons.length;
  perTrack.push(`${track} ${lessons.length}/${en.size}`);

  // (5) — a track with translated lessons must have its own copy translated.
  if (lessons.length > 0 && existsSync(idxPath)) {
    const idx = readFileSync(idxPath, "utf8");
    for (const field of ["title", "tagline", "level"]) {
      const idVal = idx.match(new RegExp(`${field}:\\s*\\n?\\s*"([^"]*)"`));
      const enIdx = readFileSync(join(EN_TRACKS, track, "index.ts"), "utf8");
      const enVal = enIdx.match(new RegExp(`${field}:\\s*\\n?\\s*"([^"]*)"`));
      if (idVal && enVal) {
        assert(
          `id/${track} index.ts: ${field} is translated, not copied from English`,
          idVal[1] !== enVal[1],
          `both are "${enVal[1]}"`,
        );
      }
    }
  }

  for (const l of lessons) {
    const name = `id/${track}/${l.slug ?? "?"}`;
    assert(`${name}: declares a slug`, Boolean(l.slug), l.file);
    if (!l.slug) continue;

    // (1)
    const source = en.get(l.slug);
    assert(
      `${name}: names a lesson that exists in English`,
      Boolean(source),
      `no lesson with slug "${l.slug}" in ${track}`,
    );
    if (!source) continue;
    assert(
      `${name}: translates a published lesson`,
      source.published,
      "the English lesson is a draft, so this has no route to appear on",
    );

    // (2)
    const idShape = selfCheckShape(l.src);
    const enShape = source.shape;
    const fmt = (s) => s.map(([q, cs]) => `${q}(${cs.join(",")})`).join(" ");
    assert(
      `${name}: self-check question and choice ids match the English lesson`,
      fmt(idShape) === fmt(enShape),
      `id ${fmt(idShape) || "(none)"} vs en ${fmt(enShape) || "(none)"} — ` +
        "ids are what the answer key is merged by, so a mismatch silently " +
        "falls back to English text",
    );

    // (6) — register. `Anda` is a proper pronoun in Indonesian and is
    // capitalised everywhere, including mid-sentence; `anda` is simply a
    // misspelling, and it is the one this content will keep making, because
    // English `you` is lowercase and a translator's hands are on the English
    // sentence. Caught by the build rather than by review: it renders
    // perfectly, reads almost right, and there will be 51 lessons of it.
    // `kamu` is the other half of the same rule — the register decision
    // (2026-08-18, owner) is `Anda` for Academy content, and a lesson that
    // slips into `kamu` is a different voice, not a typo.
    const prose = stripComments(l.src);
    const lowerAnda = [...prose.matchAll(/\banda\b/g)].length;
    assert(
      `${name}: uses "Anda", capitalised`,
      lowerAnda === 0,
      `${lowerAnda} lowercase "anda" — it is a proper pronoun, always capitalised`,
    );
    const kamu = [...prose.matchAll(/\b[Kk]amu\b/g)].length;
    assert(
      `${name}: stays in the Academy's register`,
      kamu === 0,
      `${kamu} use(s) of "kamu" — Academy content is written with "Anda"`,
    );

    // (3)
    const stripped = stripComments(l.src);
    const englishLinks = [...stripped.matchAll(/\]\((\/academy\/[^)]*)\)/g)].map(
      (m) => m[1],
    );
    assert(
      `${name}: body links stay inside Indonesian`,
      englishLinks.length === 0,
      `${englishLinks.length} link(s) to ${englishLinks.slice(0, 3).join(", ")}` +
        " — use /id/academy/…",
    );
  }
}

// (4)
const indexSrc = readFileSync("src/content/academy/index.ts", "utf8");
const en7 = indexSrc.match(/ISTQB_DISCLAIMER\s*=\s*\n?\s*"([^"]+)"/);
const id7 = indexSrc.match(/ISTQB_DISCLAIMER_ID\s*=\s*\n?\s*"([^"]+)"/);
assert("ISTQB_DISCLAIMER exists", Boolean(en7));
assert("ISTQB_DISCLAIMER_ID exists (§7.1 applies to Indonesian pages too)", Boolean(id7));
if (en7 && id7) {
  assert(
    "the Indonesian ISTQB notice is a translation, not a copy of the English one",
    en7[1] !== id7[1],
  );
  assert(
    "the Indonesian ISTQB notice still names ISTQB",
    id7[1].includes("ISTQB"),
  );
}

// (6). `\r` is normalised away first: the repo is developed on Windows, and
// matching a closing brace at the start of a line is otherwise a no-op that
// silently passes every assertion below it.
const actionSrc = stripComments(
  readFileSync("src/app/actions/academy.ts", "utf8"),
).replace(/\r\n/g, "\n");
const grader = actionSrc.slice(actionSrc.indexOf("export async function gradeSelfCheck"));
const end = grader.indexOf("\n}\n");
const graderBody = end === -1 ? grader : grader.slice(0, end + 1);
assert(
  "the gradeSelfCheck body was located (this file's other assertions rest on it)",
  end !== -1 && graderBody.length > 0,
);
assert(
  "gradeSelfCheck grades the questions the reader was actually asked",
  /localiseSelfCheck\(/.test(graderBody),
  "it resolves the lesson through the English registry only, so an Indonesian " +
    "reader gets an English explanation under an Indonesian question",
);
assert(
  "gradeSelfCheck takes the reader's language from its caller",
  /\blang\?:\s*string/.test(graderBody),
  "without a `lang` argument there is nothing to localise the explanations by",
);
assert(
  "SelfCheck passes its language to the grader",
  /gradeSelfCheck\(\{[^}]*\blang\b/.test(
    stripComments(readFileSync("src/components/SelfCheck.tsx", "utf8")).replace(
      /\r\n/g,
      "\n",
    ),
  ),
  "the component knows the language and the server action cannot guess it",
);

if (failed > 0) {
  console.error(`academy-i18n-check: FAILED (${failed} assertion(s))`);
  process.exit(1);
}
const totalEn = [...enByTrack.values()].reduce(
  (n, m) => n + [...m.values()].filter((l) => l.published).length,
  0,
);
console.log(
  `academy-i18n-check: OK (${translatedLessons}/${totalEn} lessons translated to Indonesian` +
    `${perTrack.length ? ` — ${perTrack.join(", ")}` : ""})`,
);
