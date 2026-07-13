// F-20: runs once per server process at boot (see next.config.mjs
// experimental.instrumentationHook). Used only for operator-facing warnings.
export async function register() {
  if (
    process.env.TF_DISABLE_PASSWORD_LOGIN === "1" &&
    !process.env.TF_OIDC_ISSUER &&
    !process.env.GOOGLE_CLIENT_ID &&
    !process.env.GITHUB_CLIENT_ID
  ) {
    // Password login is off and no SSO/social provider is configured — nobody
    // could sign in. Warn loudly but do not crash (env may be completed later).
    console.warn(
      "[auth] TF_DISABLE_PASSWORD_LOGIN=1 but no OIDC or social login is configured — " +
        "no one can sign in. Set TF_OIDC_ISSUER (or a GOOGLE/GITHUB client) or re-enable password login."
    );
  }
}
