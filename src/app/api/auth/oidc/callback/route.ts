import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { oidcConfig, getDiscovery, getJwks } from "@/lib/oidc";

export const dynamic = "force-dynamic";

// F-20: OIDC login — step 2 (callback). Every branch that fails a security check
// redirects to /login with a GENERIC message; the specific reason is logged
// server-side only, never echoed to the browser.
const OIDC_COOKIE = "tf_oidc";

function loginError(base: string, msg: string) {
  const res = NextResponse.redirect(`${base}/login?error=${encodeURIComponent(msg)}`);
  res.cookies.delete(OIDC_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const cfg = oidcConfig();
  if (!cfg) return loginError(base, "Single sign-on is not configured on this instance.");

  const generic = "Single sign-on failed. Please try again.";

  // Read + immediately invalidate the one-time cookie (single use).
  let stash: { state?: string; nonce?: string; verifier?: string } = {};
  try {
    stash = JSON.parse(cookies().get(OIDC_COOKIE)?.value ?? "{}");
  } catch {
    /* fall through to the state mismatch below */
  }

  const returnedState = req.nextUrl.searchParams.get("state");
  if (!stash.state || !returnedState || returnedState !== stash.state) {
    console.error("[oidc] state mismatch");
    return loginError(base, generic);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    console.error("[oidc] no authorization code in callback");
    return loginError(base, generic);
  }

  try {
    const disco = await getDiscovery(cfg.issuer);
    const redirectUri = `${base}/api/auth/oidc/callback`;

    // Exchange the code (client_secret_post + PKCE verifier).
    const tokenRes = await fetch(disco.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code_verifier: stash.verifier ?? "",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenRes.ok) {
      console.error(`[oidc] token endpoint ${tokenRes.status}`);
      return loginError(base, generic);
    }
    const tokenData = (await tokenRes.json()) as { id_token?: string };
    if (!tokenData.id_token) {
      console.error("[oidc] no id_token in token response");
      return loginError(base, generic);
    }

    // Verify the id_token signature against the IdP's JWKS, issuer, and audience.
    const { payload } = await jwtVerify(tokenData.id_token, getJwks(disco.jwks_uri), {
      issuer: cfg.issuer,
      audience: cfg.clientId,
    });

    // Bind the token to THIS login attempt.
    if (!stash.nonce || payload.nonce !== stash.nonce) {
      console.error("[oidc] nonce mismatch");
      return loginError(base, generic);
    }

    const emailClaim = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    if (!emailClaim) {
      console.error("[oidc] id_token has no email claim");
      return loginError(base, "Your identity provider did not return an email address.");
    }
    // Only trust an IdP-asserted email when it says the email is verified,
    // unless the operator explicitly opted out.
    if (!cfg.allowUnverifiedEmail && payload.email_verified !== true) {
      console.error("[oidc] email_verified not true");
      return loginError(base, "Your identity provider has not verified your email address.");
    }

    let user = await db.user.findUnique({ where: { email: emailClaim } });
    if (!user) {
      if (!cfg.autoProvision) {
        return loginError(
          base,
          `No TestForge account for ${emailClaim}. Ask an admin to invite you.`
        );
      }
      const name =
        (typeof payload.name === "string" && payload.name) ||
        (typeof payload.preferred_username === "string" && payload.preferred_username) ||
        emailClaim.split("@")[0];
      user = await db.user.create({
        data: {
          name,
          email: emailClaim,
          // No usable password — same "OAuth user" convention as social login.
          passwordHash: crypto.randomBytes(32).toString("hex"),
          role: cfg.defaultRole === "ADMIN" ? "ADMIN" : cfg.defaultRole === "VIEWER" ? "VIEWER" : "MEMBER",
          emailVerifiedAt: new Date(),
        },
      });
      await logAudit({ userId: user.id, action: "auth.register_oidc" });
    }

    // OIDC deliberately skips the app's own TOTP step — the IdP owns MFA policy.
    await logAudit({ userId: user.id, action: "auth.login", detail: "oidc" });
    await createSession(user, false);
    const res = NextResponse.redirect(`${base}${user.onboardedAt ? "/dashboard" : "/onboarding"}`);
    res.cookies.delete(OIDC_COOKIE);
    return res;
  } catch (e) {
    console.error("[oidc] callback error:", (e as Error).message);
    return loginError(base, generic);
  }
}
