import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// OAuth Google & GitHub (AU-002/AU-003). Aktif setelah env dikonfigurasi:
// GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, NEXT_PUBLIC_BASE_URL.
const PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    idEnv: "GITHUB_CLIENT_ID",
    secretEnv: "GITHUB_CLIENT_SECRET",
  },
} as const;

// Cookie penampung nilai state CSRF antara tahap redirect & callback.
const STATE_COOKIE = "tf_oauth_state";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const cfg = PROVIDERS[params.provider as keyof typeof PROVIDERS];
  if (!cfg)
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const clientId = process.env[cfg.idEnv];
  const clientSecret = process.env[cfg.secretEnv];
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(
        `OAuth ${params.provider} belum dikonfigurasi. Set ${cfg.idEnv} dan ${cfg.secretEnv} di environment.`
      )}`
    );
  }

  const redirectUri = `${base}/api/auth/oauth/${params.provider}`;
  const code = req.nextUrl.searchParams.get("code");

  // Tahap 1: redirect ke provider + set state CSRF di cookie httpOnly
  if (!code) {
    const state = crypto.randomBytes(16).toString("hex");
    const url = new URL(cfg.authUrl);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", cfg.scope);
    url.searchParams.set("state", state);
    const res = NextResponse.redirect(url);
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 menit
    });
    return res;
  }

  // Tahap 2: callback — validasi state, tukar code dengan token, ambil profil
  const returnedState = req.nextUrl.searchParams.get("state");
  const expectedState = cookies().get(STATE_COOKIE)?.value;
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent("OAuth failed: invalid state")}`
    );
  }

  try {
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No token received from the provider");

    const userRes = await fetch(cfg.userUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await userRes.json();

    let email: string | null = profile.email ?? null;
    // GitHub bisa menyembunyikan email — ambil dari endpoint emails
    if (!email && params.provider === "github") {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] =
        await emailsRes.json();
      email = emails.find((e) => e.primary && e.verified)?.email ?? null;
    }
    if (!email) throw new Error("No email available from the provider");

    const name: string = profile.name ?? profile.login ?? email.split("@")[0];
    email = email.toLowerCase();

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // New signups own the organization they create at onboarding, so ADMIN.
      // email from the OAuth provider is treated as already verified.
      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash: crypto.randomBytes(32).toString("hex"),
          role: "ADMIN",
          emailVerifiedAt: new Date(),
          avatarUrl: profile.picture ?? profile.avatar_url ?? null,
        },
      });
      await logAudit({
        userId: user.id,
        action: "auth.register_oauth",
        detail: params.provider,
      });
    }

    await logAudit({ userId: user.id, action: "auth.login_oauth", detail: params.provider });
    await createSession(user, true);
    const res = NextResponse.redirect(
      `${base}${user.onboardedAt ? "/dashboard" : "/onboarding"}`
    );
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (e) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(`OAuth gagal: ${(e as Error).message}`)}`
    );
  }
}
