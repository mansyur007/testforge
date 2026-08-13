// A-07: unit tests for certificate serial derivation (docs/QA-ACADEMY.md §8's
// A-07 acceptance criteria): the same achievement always derives the same
// serial, every field of the achievement changes it, a different secret changes
// it, and the 16 symbols carry the 80 bits the page's access control assumes.
//
// Runs against src/lib/academy/certificates-core.mjs directly — no database, no
// Next runtime, no TS — same shape as scripts/academy-exam-selftest.mjs, wired
// into `prebuild` so `npm run build` covers it with no CI change.
//
// Why a *unit* test carries this much weight here: the serial is the whole
// access control on /academy/certificate/<serial>, and both properties it
// depends on are invisible to the e2e suite. TC-*-117 can prove one certificate
// resolves; it cannot prove the derivation is unbiased, and it cannot prove that
// re-earning the same achievement lands on the same row rather than a second
// one — which is the property that makes @@unique([userId, kind, refSlug]) a
// no-op instead of a crash.
import {
  SERIAL_ALPHABET,
  SERIAL_PATTERN,
  SERIAL_SYMBOLS,
  deriveSerial,
  normalizeSerial,
} from "../src/lib/academy/certificates-core.mjs";

let failed = 0;
function assert(name, ok, detail) {
  if (!ok) {
    failed++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const SECRET = "selftest-secret";
const BASE = { secret: SECRET, userId: "clxuser000000000000000000", kind: "EXAM", refSlug: "ctfl-v4-full" };

// ---------------------------------------------------------------------------
// Shape. The serial is read off a screen and typed back in more often than any
// other identifier in this codebase, which is what the alphabet is for.
// ---------------------------------------------------------------------------

{
  const serial = deriveSerial(BASE);
  assert("shape: matches TF-XXXX-XXXX-XXXX-XXXX", SERIAL_PATTERN.test(serial), serial);
  assert("shape: 16 symbols plus the TF prefix and four dashes", serial.length === 3 + SERIAL_SYMBOLS + 3, serial);

  assert("alphabet: 32 symbols", SERIAL_ALPHABET.length === 32);
  assert("alphabet: no repeated symbol", new Set(SERIAL_ALPHABET).size === 32);
  assert(
    "alphabet: Crockford's exclusions (I, L, O, U) are absent",
    !/[ILOU]/.test(SERIAL_ALPHABET),
  );

  // The pattern is what routes and tests match against, so it has to agree with
  // the alphabet rather than merely look like it does.
  const outsideAlphabet = [...SERIAL_ALPHABET].some((c) => !SERIAL_PATTERN.test(`TF-${c.repeat(4)}-AAAA-AAAA-AAAA`));
  assert("alphabet: every symbol it can emit is accepted by SERIAL_PATTERN", !outsideAlphabet);
  assert(
    "pattern: rejects a serial carrying an excluded symbol",
    !SERIAL_PATTERN.test("TF-IIII-AAAA-AAAA-AAAA"),
  );
}

// ---------------------------------------------------------------------------
// Determinism. This is what turns a double-issue into a no-op: the second
// derivation computes the serial the unique index already holds.
// ---------------------------------------------------------------------------

{
  assert(
    "derive: the same achievement derives the same serial",
    deriveSerial(BASE) === deriveSerial({ ...BASE }),
  );

  // A thousand repeats, because "deterministic" failing intermittently is the
  // shape of bug that a single comparison would miss — a Math.random() or a
  // Date.now() creeping into the input would still agree most of the time.
  let drifted = 0;
  const first = deriveSerial(BASE);
  for (let i = 0; i < 1000; i++) if (deriveSerial(BASE) !== first) drifted++;
  assert("derive: stable across 1000 repeats", drifted === 0, `${drifted} drifted`);
}

// ---------------------------------------------------------------------------
// Every field of the achievement, and the secret, change the serial.
// ---------------------------------------------------------------------------

{
  const base = deriveSerial(BASE);
  assert(
    "derive: a different holder derives a different serial",
    deriveSerial({ ...BASE, userId: "clxuser000000000000000001" }) !== base,
  );
  assert(
    "derive: a different kind derives a different serial",
    deriveSerial({ ...BASE, kind: "TRACK" }) !== base,
  );
  assert(
    "derive: a different refSlug derives a different serial",
    deriveSerial({ ...BASE, refSlug: "ctfl-v4-ch1" }) !== base,
  );
  assert(
    "derive: a different secret derives a different serial",
    deriveSerial({ ...BASE, secret: "another-secret" }) !== base,
  );

  // The fields are joined with NUL rather than a printable separator. Without a
  // separator at all, ("a", "bc") and ("ab", "c") would hash to one input and
  // two different achievements would share a serial — which the unique index on
  // `serial` would then surface as a failed issue for whoever came second.
  assert(
    "derive: field boundaries are unambiguous — (refSlug a, userId bc) != (refSlug ab, userId c)",
    deriveSerial({ secret: SECRET, kind: "TRACK", refSlug: "a", userId: "bc" }) !==
      deriveSerial({ secret: SECRET, kind: "TRACK", refSlug: "ab", userId: "c" }),
  );
}

// ---------------------------------------------------------------------------
// The 80 bits. `/academy/certificate/<serial>` has no session on it, so the
// entropy *is* the access control — a biased symbol distribution would spend
// some of it, and a collision would hand one holder another's page.
// ---------------------------------------------------------------------------

{
  // 256 is a multiple of 32, so the modulo in deriveSerial introduces no bias.
  // Check that rather than assume it: 20,000 serials, every symbol counted
  // across all 16 positions. Expected 20000*16/32 = 10,000 per symbol; the
  // band is wide enough that it cannot fail by chance (a dropped or doubled
  // symbol lands far outside it, a uniform one never comes close).
  const counts = new Map([...SERIAL_ALPHABET].map((c) => [c, 0]));
  const serials = new Set();
  const N = 20_000;
  for (let i = 0; i < N; i++) {
    const serial = deriveSerial({ ...BASE, userId: `clxuser${String(i).padStart(18, "0")}` });
    serials.add(serial);
    for (const c of serial.replace(/^TF-/, "").replaceAll("-", "")) {
      counts.set(c, counts.get(c) + 1);
    }
  }

  const seen = [...counts.values()];
  const expected = (N * SERIAL_SYMBOLS) / SERIAL_ALPHABET.length;
  const low = Math.min(...seen);
  const high = Math.max(...seen);
  assert(
    "entropy: every symbol of the alphabet is reachable",
    low > 0,
    `least-used symbol appeared ${low} times`,
  );
  assert(
    "entropy: no symbol is over- or under-produced (modulo bias)",
    low > expected * 0.9 && high < expected * 1.1,
    `expected ~${expected}, got ${low}..${high}`,
  );
  assert(
    "entropy: 20,000 distinct holders derive 20,000 distinct serials",
    serials.size === N,
    `${N - serials.size} collision(s)`,
  );
}

// ---------------------------------------------------------------------------
// normalizeSerial — a hand-typed URL must not 404 over case or a stray space.
// ---------------------------------------------------------------------------

{
  const serial = deriveSerial(BASE);
  assert("normalize: lowercase resolves to the stored form", normalizeSerial(serial.toLowerCase()) === serial);
  assert("normalize: surrounding whitespace is trimmed", normalizeSerial(`  ${serial}\n`) === serial);
  assert("normalize: already-normal input is unchanged", normalizeSerial(serial) === serial);
  // The page passes a route param straight in, and Next can hand it something
  // that isn't a string; "" then misses the unique index and 404s, which is the
  // right answer for a serial that was never a serial.
  assert("normalize: nullish input becomes an empty string, not a crash", normalizeSerial(undefined) === "" && normalizeSerial(null) === "");
}

// ---------------------------------------------------------------------------
// A golden vector. Serials are *stored*, so changing the derivation would not
// break links already issued — it would do something quieter and worse: the
// next issue for an achievement someone already holds would derive a different
// serial, and @@unique([userId, kind, refSlug]) would reject it as a duplicate
// the application then has to explain. If this line has to change, that is the
// decision being made.
// ---------------------------------------------------------------------------

{
  const vector = deriveSerial({
    secret: "testforge-dev-secret",
    userId: "clx0000000000000000000000",
    kind: "EXAM",
    refSlug: "ctfl-v4-full",
  });
  assert(
    "golden: the published derivation has not changed",
    vector === "TF-D64T-VDM1-61JS-A42W",
    `got ${vector}`,
  );
}

if (failed > 0) {
  console.error(`academy-certificate-selftest: FAILED (${failed} assertion(s))`);
  process.exit(1);
}
console.log(
  "academy-certificate-selftest: OK (shape, determinism over 1000 repeats, field separation, 20k-serial distribution, normalization, golden vector)",
);
