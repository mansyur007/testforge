import { createRemoteJWKSet } from "jose";

// F-20: generic OpenID Connect login. The whole feature is dormant unless
// TF_OIDC_ISSUER is set. We deliberately reuse the `jose` dependency already in
// the tree (JWKS + id_token verification) and add no OIDC-specific SDK.

export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  autoProvision: boolean;
  defaultRole: string;
  buttonLabel: string;
  allowUnverifiedEmail: boolean;
};

export function oidcEnabled(): boolean {
  return !!process.env.TF_OIDC_ISSUER;
}

/** Returns the config, or null when OIDC is not fully configured. */
export function oidcConfig(): OidcConfig | null {
  const issuer = process.env.TF_OIDC_ISSUER;
  const clientId = process.env.TF_OIDC_CLIENT_ID;
  const clientSecret = process.env.TF_OIDC_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return null;
  return {
    issuer: issuer.replace(/\/$/, ""),
    clientId,
    clientSecret,
    autoProvision: process.env.TF_OIDC_AUTO_PROVISION === "1",
    defaultRole: process.env.TF_OIDC_DEFAULT_ROLE ?? "MEMBER",
    buttonLabel: process.env.TF_OIDC_BUTTON_LABEL || "Single sign-on",
    allowUnverifiedEmail: process.env.TF_OIDC_ALLOW_UNVERIFIED_EMAIL === "1",
  };
}

export type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

// Module-scope caches (survive within a single Next.js process). Discovery has a
// 1-hour TTL; the JWKS set is cached by uri and manages its own key rotation.
let discoveryCache: { issuer: string; at: number; doc: Discovery } | null = null;
const DISCOVERY_TTL_MS = 60 * 60 * 1000;

export async function getDiscovery(issuer: string): Promise<Discovery> {
  const now = Date.now();
  if (
    discoveryCache &&
    discoveryCache.issuer === issuer &&
    now - discoveryCache.at < DISCOVERY_TTL_MS
  ) {
    return discoveryCache.doc;
  }
  const res = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`OIDC discovery failed (${res.status})`);
  const doc = (await res.json()) as Discovery;
  if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri)
    throw new Error("OIDC discovery document is missing required endpoints");
  discoveryCache = { issuer, at: now, doc };
  return doc;
}

let jwksCache: { uri: string; set: ReturnType<typeof createRemoteJWKSet> } | null = null;

export function getJwks(uri: string) {
  if (!jwksCache || jwksCache.uri !== uri) {
    jwksCache = { uri, set: createRemoteJWKSet(new URL(uri)) };
  }
  return jwksCache.set;
}
