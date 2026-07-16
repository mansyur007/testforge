// App-level secret encryption (spec'd in F-07, first used by F-08 to store
// notification webhook URLs). AES-256-GCM with a key derived (scrypt) from the
// app secret. Payload format: v1:<iv b64>:<tag b64>:<cipher b64>.
// NEVER log decrypted values; never return them from an API/serializer.
//
// This is plain ESM rather than TypeScript because L-05's restore script runs
// under bare `node` on a fresh instance — a production image has no TS loader
// and no devDependencies. `crypto.ts` re-exports it, so app code is unaffected
// and both paths share one implementation of the payload format.
import crypto from "crypto";

const DEV_SECRET = "testforge-dev-secret";

function appSecret() {
  const s = process.env.TF_SECRET ?? process.env.AUTH_SECRET;
  if (!s) {
    console.warn(
      "[crypto] TF_SECRET/AUTH_SECRET not set — using the dev default. " +
        "Set a real secret in production."
    );
    return DEV_SECRET;
  }
  return s;
}

let cachedKey = null;
function key() {
  if (!cachedKey)
    cachedKey = crypto.scryptSync(appSecret(), "testforge-crypto-v1", 32);
  return cachedKey;
}

/**
 * @param {string} plaintext
 * @returns {string}
 */
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/**
 * @param {string} payload
 * @returns {boolean}
 */
export function isEncrypted(payload) {
  return payload.startsWith("v1:");
}

/**
 * Throws on tampering or a wrong/changed TF_SECRET.
 * @param {string} payload
 * @returns {string}
 */
export function decrypt(payload) {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64)
    throw new Error("Unrecognized encrypted payload format");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
