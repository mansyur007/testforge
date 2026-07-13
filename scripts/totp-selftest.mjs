// F-20: self-test for the TOTP algorithm against RFC 6238 Appendix B vectors.
// Run in CI before the build (see package.json). This reimplements the HOTP core
// so the RFC-published outputs pin the algorithm independently of src/lib/totp.ts;
// the e2e drives the real lib through the app end-to-end.

import crypto from "crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input) {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error("bad base32");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

function hotp(secret, counter, digits) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, "0");
}

function totpAt(secretB32, tSeconds, digits) {
  return hotp(base32Decode(secretB32), Math.floor(tSeconds / 30), digits);
}

// RFC 6238 Appendix B — SHA-1 seed "12345678901234567890" (20 ASCII bytes).
const seed = Buffer.from("12345678901234567890", "ascii");
const secret = base32Encode(seed);

// Round-trip check on the base32 codec itself.
if (!base32Decode(secret).equals(seed)) {
  console.error("FAIL: base32 round-trip");
  process.exit(1);
}

// [ unix time seconds, expected 8-digit code ] from the RFC table.
const vectors8 = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

let failed = 0;
for (const [t, expected8] of vectors8) {
  const got8 = totpAt(secret, t, 8);
  const got6 = totpAt(secret, t, 6);
  const expected6 = expected8.slice(-6);
  const ok = got8 === expected8 && got6 === expected6;
  if (!ok) {
    failed++;
    console.error(`FAIL t=${t}: 8-digit got ${got8} want ${expected8}; 6-digit got ${got6} want ${expected6}`);
  }
}

if (failed) {
  console.error(`totp-selftest: ${failed} vector(s) failed`);
  process.exit(1);
}
console.log(`totp-selftest: OK (${vectors8.length} RFC 6238 vectors, base32 round-trip)`);
