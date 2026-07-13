import crypto from "crypto";

// F-20: RFC 6238 TOTP (time-based one-time password) with a base32 secret,
// implemented on node's `crypto` alone — no otplib/speakeasy dependency.
// Defaults: HMAC-SHA1, 30-second step, 6 digits — the settings every
// authenticator app (Google Authenticator, Authy, 1Password, …) assumes.

const STEP_SECONDS = 30;
const DIGITS = 6;

// RFC 4648 base32 alphabet (no padding on the wire; we strip "=" on decode).
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Generate a fresh 20-byte secret, encoded as base32 (the otpauth format). */
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) throw new Error("Invalid base32 character in TOTP secret");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// The HOTP core (RFC 4226): HMAC-SHA1 over the 8-byte counter, dynamic-truncate,
// mod 10^digits, left-zero-padded.
function hotp(secret: Buffer, counter: number, digits = DIGITS): string {
  const buf = Buffer.alloc(8);
  // counter fits in 53-bit safe-integer range for any realistic time; write as
  // two 32-bit halves so we don't lose the high bits.
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

/** The current TOTP code for a base32 secret at time `t` (ms since epoch). */
export function totp(secret: string, t: number = Date.now()): string {
  const counter = Math.floor(t / 1000 / STEP_SECONDS);
  return hotp(base32Decode(secret), counter);
}

/**
 * Verify a user-entered code against the secret, accepting the ±1 step window
 * (≈90 s total) to tolerate clock skew and a code typed near a boundary.
 * Constant-time compare on the padded strings so a valid code can't be timed
 * out digit-by-digit.
 */
export function verifyTotp(secret: string, code: string, t: number = Date.now()): boolean {
  const cleaned = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(t / 1000 / STEP_SECONDS);
  for (let w = -1; w <= 1; w++) {
    const candidate = hotp(key, counter + w);
    if (
      candidate.length === cleaned.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(cleaned))
    ) {
      return true;
    }
  }
  return false;
}

/** The otpauth:// URI an authenticator app scans as a QR code. */
export function otpauthUri(email: string, secret: string): string {
  const label = encodeURIComponent(`TestForge:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: "TestForge",
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
