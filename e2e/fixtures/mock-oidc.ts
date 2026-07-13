import http from "node:http";
import { AddressInfo } from "node:net";
// jose is ESM-only; the Playwright runner compiles specs to CommonJS, so it must
// be pulled in via dynamic import() rather than a static top-level import.

// F-20: a minimal OpenID Connect provider for the e2e — discovery, JWKS, an
// authorization endpoint that immediately redirects back with a code, and a
// token endpoint that returns a signed id_token. Mirrors the real IdP contract
// closely enough to exercise the app's PKCE/state/nonce/JWKS verification.

export type MockOidcControls = {
  server: http.Server;
  issuer: string;
  // Mutable knobs the tests flip between scenarios.
  config: {
    email: string;
    emailVerified: boolean;
    // When true the id_token carries a wrong nonce → the app must reject it.
    tamperNonce: boolean;
  };
  close: () => Promise<void>;
};

export async function startMockOidc(port: number): Promise<MockOidcControls> {
  const { generateKeyPair, exportJWK, SignJWT } = await import("jose");
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "e2e-key-1";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const issuer = `http://127.0.0.1:${port}`;
  const config: MockOidcControls["config"] = {
    email: "sso-user@testforge.local",
    emailVerified: true,
    tamperNonce: false,
  };
  // nonce captured from /authorize, echoed (or corrupted) into the id_token.
  let lastNonce = "";

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", issuer);
    if (url.pathname === "/.well-known/openid-configuration") {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          issuer,
          authorization_endpoint: `${issuer}/authorize`,
          token_endpoint: `${issuer}/token`,
          jwks_uri: `${issuer}/jwks`,
        })
      );
      return;
    }
    if (url.pathname === "/jwks") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    if (url.pathname === "/authorize") {
      lastNonce = url.searchParams.get("nonce") ?? "";
      const redirectUri = url.searchParams.get("redirect_uri") ?? "";
      const state = url.searchParams.get("state") ?? "";
      const back = new URL(redirectUri);
      back.searchParams.set("code", "mock-auth-code");
      back.searchParams.set("state", state);
      res.statusCode = 302;
      res.setHeader("location", back.toString());
      res.end();
      return;
    }
    if (url.pathname === "/token" && req.method === "POST") {
      const idToken = await new SignJWT({
        email: config.email,
        email_verified: config.emailVerified,
        name: "SSO User",
        nonce: config.tamperNonce ? "wrong-nonce" : lastNonce,
      })
        .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
        .setIssuer(issuer)
        .setAudience("testforge-e2e")
        .setSubject("mock-subject-123")
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ access_token: "mock-access", id_token: idToken, token_type: "Bearer" }));
      return;
    }
    res.statusCode = 404;
    res.end("not found");
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const actualPort = (server.address() as AddressInfo).port;

  return {
    server,
    issuer: `http://127.0.0.1:${actualPort}`,
    config,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
