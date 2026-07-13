import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { oidcConfig, getDiscovery } from "@/lib/oidc";

export const dynamic = "force-dynamic";

// F-20: OIDC login — step 1 (start). Generates PKCE + state + nonce, stashes them
// in one httpOnly cookie, and redirects to the IdP's authorization endpoint.
const OIDC_COOKIE = "tf_oidc";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(req: NextRequest) {
  const cfg = oidcConfig();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  if (!cfg) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent("Single sign-on is not configured on this instance.")}`
    );
  }

  let disco;
  try {
    disco = await getDiscovery(cfg.issuer);
  } catch (e) {
    console.error("[oidc] discovery error:", (e as Error).message);
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent("Single sign-on is temporarily unavailable.")}`
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());

  const redirectUri = `${base}/api/auth/oidc/callback`;
  const authUrl = new URL(disco.authorization_endpoint);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", cfg.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OIDC_COOKIE, JSON.stringify({ state, nonce, verifier }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
