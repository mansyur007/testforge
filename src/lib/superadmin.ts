import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { redirect, notFound } from "next/navigation";

// F-41: instance super admin — a read-only, cross-organization view of every
// registered user.
//
// This is deliberately NOT a User row. Org roles (ADMIN/MEMBER/VIEWER) are
// tenant-scoped by design and nothing in the app may read across tenants; the
// operator of the instance is a different actor, so it gets a different
// credential (static, from env) and a different cookie. No signup, no password
// reset, no email — an attacker who owns a normal account gains nothing here.
//
// Dormant unless TF_SUPERADMIN_USER and a password are both configured: every
// /superadmin route 404s, exactly as if the feature did not exist.

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "testforge-dev-secret"
);
const COOKIE = "tf_superadmin";
const PURPOSE = "superadmin";

/** Static credentials are never rotated by a human, so demand a long one. */
export const MIN_PASSWORD_LENGTH = 24;
/** Short by design — this session outlives no working day. */
const SESSION_SECONDS = 60 * 60 * 8;

export type SuperadminSession = { username: string; purpose: typeof PURPOSE };

function rawConfig() {
  return {
    username: process.env.TF_SUPERADMIN_USER?.trim() ?? "",
    password: process.env.TF_SUPERADMIN_PASSWORD ?? "",
    passwordHash: process.env.TF_SUPERADMIN_PASSWORD_HASH?.trim() ?? "",
  };
}

let warned = false;

/**
 * The configured super admin, or null when the feature is off. A username with
 * a too-short plaintext password counts as off — refusing to enable is safer
 * than serving every account behind a guessable string.
 */
export function superadminConfig(): { username: string } | null {
  const { username, password, passwordHash } = rawConfig();
  if (!username) return null;
  if (passwordHash) return { username };
  if (password.length >= MIN_PASSWORD_LENGTH) return { username };
  if (!warned) {
    warned = true;
    console.warn(
      `[superadmin] TF_SUPERADMIN_USER is set but no usable password: ` +
        `set TF_SUPERADMIN_PASSWORD_HASH (bcrypt) or a TF_SUPERADMIN_PASSWORD ` +
        `of at least ${MIN_PASSWORD_LENGTH} characters. /superadmin stays disabled.`
    );
  }
  return null;
}

export function superadminEnabled() {
  return superadminConfig() !== null;
}

/** Length-independent constant-time compare (hash first, then compare digests). */
function safeEqual(a: string, b: string) {
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

export async function verifySuperadminCredentials(
  username: string,
  password: string
) {
  const cfg = superadminConfig();
  if (!cfg) return false;
  const { password: plain, passwordHash } = rawConfig();
  // Both checks always run — no early return that would leak which half failed.
  const userOk = safeEqual(username.trim(), cfg.username);
  const passOk = passwordHash
    ? await bcrypt.compare(password, passwordHash)
    : safeEqual(password, plain);
  return userOk && passOk;
}

export async function createSuperadminSession(username: string) {
  const token = await new SignJWT({ username, purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(SECRET);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS,
    // Scoped to the console: the cookie is never sent with ordinary app traffic.
    path: "/superadmin",
  });
}

export function clearSuperadminSession() {
  cookies().delete({ name: COOKIE, path: "/superadmin" });
}

export async function getSuperadminSession(): Promise<SuperadminSession | null> {
  // Turning the feature off invalidates outstanding cookies immediately.
  const cfg = superadminConfig();
  if (!cfg) return null;
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    // AUTH_SECRET also signs normal sessions — the purpose claim is what stops
    // a `tf_session` JWT from being replayed as an operator cookie.
    if (payload.purpose !== PURPOSE) return null;
    if (payload.username !== cfg.username) return null;
    return payload as unknown as SuperadminSession;
  } catch {
    return null;
  }
}

/** Page guard: 404 when dormant, redirect to the console login when signed out. */
export async function requireSuperadmin(): Promise<SuperadminSession> {
  if (!superadminEnabled()) notFound();
  const session = await getSuperadminSession();
  if (!session) redirect("/superadmin/login");
  return session;
}
