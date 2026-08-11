import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { test, expect } from "@playwright/test";

// `getSession()` (src/lib/auth.ts) verifies the `tf_session` JWT's signature,
// which proves the cookie wasn't tampered with but says nothing about whether
// `payload.userId` still has a row in `User` — that row can be gone if the
// account was deleted, or (the common way to hit this in dev) `dev.db` got
// reset while a browser still held an old cookie. Before the fix this class
// throws deep inside whatever write happened to run first
// (`PrismaClientKnownRequestError P2003`, foreign key violation), one
// unhandled 500 per call site, instead of every session-gated page/action
// treating the caller as signed out like they would for no cookie at all.
//
// This mints a JWT that is cryptographically valid — signed with the same
// AUTH_SECRET the dev server uses — for a user that has already been deleted,
// the same shape `createSession()` produces (userId/email/name/role, HS256).
// AUTH_SECRET isn't a real secret (it's the checked-in dev default in
// `.env`), so reading it here rather than hardcoding a copy is just to not
// drift from whatever `.env` says.
const db = new PrismaClient();

function readAuthSecret(): string {
  const envPath = path.resolve(__dirname, "..", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const match = raw.match(/^AUTH_SECRET="?([^"\n]+)"?/m);
  if (!match) throw new Error("AUTH_SECRET not found in .env");
  return match[1];
}

async function mintStaleSessionToken(userId: string): Promise<string> {
  // Dynamic import: `jose` ships ESM-only, and Playwright transpiles specs to
  // CommonJS — a static import fails with "require() of ES Module … not
  // supported" the same way it would from any other CJS file.
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(readAuthSecret());
  return new SignJWT({
    userId,
    email: "ghost@testforge.local",
    name: "Ghost User",
    role: "MEMBER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

test("TC-E2E-104 a session for a deleted user is treated as signed out, not a 500", async ({
  context,
  page,
}) => {
  // A real user, so the token below is valid at mint time, then removed —
  // reproducing "cookie outlives the row" without needing to fabricate a
  // syntactically-valid-but-never-real id.
  const passwordHash = await bcrypt.hash("GhostUser123", 10);
  const ghost = await db.user.create({
    data: {
      name: "Ghost User",
      email: `ghost-${Date.now()}@testforge.local`,
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });
  const token = await mintStaleSessionToken(ghost.id);
  await db.user.delete({ where: { id: ghost.id } });

  await context.addCookies([
    { name: "tf_session", value: token, url: "http://localhost:3456" },
  ]);

  // `AppLayout` (src/app/(app)/layout.tsx) is the app-wide gate — every
  // `/dashboard`, `/projects/*`, etc. route sits behind its single
  // `requireSession()` call, so this one page stands in for all of them.
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.locator("body")).not.toContainText("Application error");

  // Academy's own session-gated pages (A-04/A-05) call `requireSession()`
  // independently of `AppLayout` — worth confirming they degrade the same
  // way rather than assuming the fix is centralized just because it lives in
  // one function.
  await page.goto("/academy/sandbox");
  await page.waitForURL("**/login");
  await expect(page.locator("body")).not.toContainText("Application error");

  await page.goto("/academy/me");
  await page.waitForURL("**/login");
  await expect(page.locator("body")).not.toContainText("Application error");
});
