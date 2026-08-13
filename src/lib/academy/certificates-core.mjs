import crypto from "crypto";

// A-07: certificate serial derivation, as pure functions.
//
// Plain ESM, not TypeScript, for the same reason as `checks-core.mjs` and
// `exam-core.mjs`: `scripts/academy-certificate-selftest.mjs` runs these under
// bare `node` in `prebuild`, with no TS loader, no database and no Next
// runtime. `src/lib/academy/certificates.ts` is the typed layer that stores
// what comes out of here and reads it back.
//
// The secret is a parameter rather than an env read, which is what makes the
// two properties that matter testable at all: that the same achievement always
// derives the same serial, and that a different secret derives a different one.

/**
 * Crockford's base32 alphabet — I, L, O and U removed so a serial read off a
 * screen and typed back in can't collapse 1/I or 0/O. A certificate serial gets
 * transcribed by hand more often than any other identifier in this codebase.
 */
export const SERIAL_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** 16 symbols over a 32-symbol alphabet = 80 bits. That number *is* the access
 *  control on `/academy/certificate/<serial>` — there is no session on it. */
export const SERIAL_SYMBOLS = 16;

const PURPOSE = "academy-certificate";

/** `TF-XXXX-XXXX-XXXX-XXXX` — the shape a serial always has. */
export const SERIAL_PATTERN = /^TF(-[0-9A-HJKMNP-TV-Z]{4}){4}$/;

/**
 * The serial for one achievement.
 *
 * Deterministic on purpose. It means issuing the same achievement twice
 * computes the same serial, so the unique index turns a double-issue into a
 * no-op instead of a second certificate — the same move `@@unique([userId,
 * seed])` makes for exam replays (A-10b). Unguessable because the HMAC key
 * never leaves the server: there is nothing in the URL to reverse.
 *
 * Fields are joined with NUL rather than a printable separator so no two
 * different (kind, refSlug, userId) triples can run into each other and produce
 * one input string. Cuids and slugs cannot contain a NUL byte, so the split is
 * unambiguous by construction rather than by convention.
 */
export function deriveSerial({ secret, userId, kind, refSlug }) {
  const mac = crypto
    .createHmac("sha256", secret)
    .update([PURPOSE, kind, refSlug, userId].join("\u0000"))
    .digest();
  // 256 is a multiple of 32, so the modulo introduces no bias across symbols.
  let out = "";
  for (let i = 0; i < SERIAL_SYMBOLS; i++) {
    out += SERIAL_ALPHABET[mac[i] % SERIAL_ALPHABET.length];
  }
  return `TF-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

/** Serials are stored and displayed uppercase; a hand-typed URL shouldn't 404
 *  over case, and the alphabet has no lowercase symbols to be confused with. */
export function normalizeSerial(raw) {
  return String(raw ?? "").trim().toUpperCase();
}
