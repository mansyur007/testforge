import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "testforge-dev-secret"
);
const COOKIE = "tf_session";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// bcrypt hashes always start with "$2"; OAuth users get a random hex placeholder
// (see api/auth/oauth) — so this tells a real password apart from "no password yet".
export function hasUsablePassword(passwordHash: string) {
  return passwordHash.startsWith("$2");
}

// PRD §12.6.1: "Remember me" = 30 hari, default 1 hari.
// AU-010 (refresh token rotation) masuk backlog — lihat docs/DOCUMENTATION.md (Part II — PRD Audit).
export async function createSession(
  user: { id: string; email: string; name: string; role: string },
  rememberMe = false
) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "30d" : "1d")
    .sign(SECRET);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

// F-20: the short-lived pending token that bridges the two login steps when 2FA
// is enabled. Password success sets this — NOT a real session — so an attacker
// who only knows the password never receives a `tf_session` cookie.
const PENDING_2FA_COOKIE = "tf_2fa";

export type Pending2fa = {
  userId: string;
  rememberMe: boolean;
  next: string;
  purpose: "2fa";
};

export async function createPending2fa(data: Omit<Pending2fa, "purpose">) {
  const token = await new SignJWT({ ...data, purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(SECRET);
  cookies().set(PENDING_2FA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });
}

export async function readPending2fa(): Promise<Pending2fa | null> {
  const token = cookies().get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== "2fa") return null;
    return payload as unknown as Pending2fa;
  } catch {
    return null;
  }
}

export function clearPending2fa() {
  cookies().delete(PENDING_2FA_COOKIE);
}

// A verified JWT only proves the cookie hasn't been tampered with — it says
// nothing about whether `payload.userId` still has a row in `User`. It won't
// if the account was deleted, or (the common way to hit this in dev) `dev.db`
// got reset while a browser still held an old cookie. Every write scoped to
// `session.userId` (`db.<model>.create({ data: { userId: session.userId } }
// )`) assumes that row exists — Prisma enforces the foreign key, so a stale
// session doesn't silently do nothing, it throws `P2003` from deep inside
// whatever action happened to run the write, one 500 per call site. Checking
// existence here, once, is what lets every one of those call sites treat a
// stale session exactly like no session at all — `getMyLessonProgress`
// returns `{ authed: false }`, `requireSession()` redirects to `/login`, etc.
// — without each of them needing to know this failure mode exists.
//
// The extra `db.user.findUnique` is a real query on top of what used to be
// pure JWT verification, but `getSession()` is called many times over the
// life of one request (layout, page, and any server actions it triggers), so
// `cache()` (React's per-request memoization, not `unstable_cache` — this
// must NOT survive past the current request) collapses that back down to at
// most one query per request rather than one per call site.
export const getSession = cache(async (): Promise<Session | null> => {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let payload: Session;
  try {
    payload = (await jwtVerify(token, SECRET)).payload as unknown as Session;
  } catch {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });
  if (!user) return null;

  return payload;
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Verify a raw API key token and return its stored record (incl. scope) plus
 * the owning user. Bumps lastUsedAt. Returns null for an unknown token.
 */
export async function verifyApiKey(token: string) {
  const crypto = await import("crypto");
  const keyHash = crypto.createHash("sha256").update(token).digest("hex");
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });
  if (!apiKey) return null;

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  return apiKey;
}

/** Autentikasi request API via Bearer API key (untuk CI/CD, PRD §5.3). */
export async function authenticateApiKey(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const apiKey = await verifyApiKey(token);
  return apiKey ? apiKey.user : null;
}
