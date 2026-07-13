import crypto from "crypto";

// F-20: pure helpers shared by the 2FA settings actions and the login flow.
// Kept out of the "use server" action file (which may only export async actions)
// and out of any client bundle (node crypto only).

export function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Normalize a user-entered recovery code to its canonical stored form. */
export function normalizeRecoveryCode(input: string): string {
  return input.trim().toLowerCase().replace(/\s/g, "");
}

/**
 * 10 single-use codes formatted xxxxx-xxxxx (lowercase hex). Returns the raw
 * codes (shown to the user once) plus the sha256 hashes to persist.
 */
export function makeRecoveryCodes(): { raw: string[]; hashes: string[] } {
  const raw: string[] = [];
  for (let i = 0; i < 10; i++) {
    const hex = crypto.randomBytes(5).toString("hex"); // 10 hex chars
    raw.push(`${hex.slice(0, 5)}-${hex.slice(5)}`);
  }
  return { raw, hashes: raw.map(sha256Hex) };
}
