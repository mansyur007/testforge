import { Client, escapeFilter, InvalidCredentialsError, type Entry } from "ldapts";

// F-34: LDAP / Active Directory login for self-hosted instances. The whole
// feature is dormant unless TF_LDAP_URL is set — no connection is ever opened,
// and login() behaves exactly as it did before.
//
// Unlike OIDC (F-20), LDAP is a *credential* backend, not a redirect flow: the
// user types their username and password into the normal login form and we
// prove those credentials by binding to the directory as them. That means the
// password reaches our process, so the rules below are not optional:
//   - the user password is ONLY ever sent to the directory in a bind, never
//     logged, never compared locally, never stored (not even hashed);
//   - a search filter is built with escaped input (RFC 4515) so a username can
//     never inject filter syntax;
//   - an empty password is rejected before we bind, because most directories
//     treat a zero-length password as a request for an *anonymous* bind and
//     answer "success" — which would authenticate anyone who knows a username.

export type LdapConfig = {
  url: string;
  /** Service account used for the lookup search. Empty = anonymous search. */
  bindDn: string;
  bindPassword: string;
  baseDn: string;
  /** Filter template; `{{username}}` is replaced with the escaped input. */
  userFilter: string;
  attrEmail: string;
  attrName: string;
  /** Role given to auto-provisioned accounts. */
  defaultRole: string;
  autoProvision: boolean;
  /** Upgrade a plain ldap:// connection with StartTLS before binding. */
  startTls: boolean;
  /** Skip TLS certificate verification (self-signed corp CAs). */
  tlsRejectUnauthorized: boolean;
  /** Organization slug new accounts join; empty = the instance's only org. */
  orgSlug: string;
};

export function ldapEnabled(): boolean {
  return !!process.env.TF_LDAP_URL;
}

/** Returns the config, or null when LDAP is not fully configured. */
export function ldapConfig(): LdapConfig | null {
  const url = process.env.TF_LDAP_URL;
  const baseDn = process.env.TF_LDAP_BASE_DN;
  if (!url || !baseDn) return null;
  return {
    url,
    bindDn: process.env.TF_LDAP_BIND_DN ?? "",
    bindPassword: process.env.TF_LDAP_BIND_PASSWORD ?? "",
    baseDn,
    // Default suits both OpenLDAP (uid) and Active Directory (sAMAccountName).
    userFilter:
      process.env.TF_LDAP_USER_FILTER ||
      "(|(uid={{username}})(sAMAccountName={{username}})(mail={{username}}))",
    attrEmail: process.env.TF_LDAP_ATTR_EMAIL || "mail",
    attrName: process.env.TF_LDAP_ATTR_NAME || "cn",
    defaultRole: process.env.TF_LDAP_DEFAULT_ROLE ?? "MEMBER",
    autoProvision: process.env.TF_LDAP_AUTO_PROVISION === "1",
    startTls: process.env.TF_LDAP_START_TLS === "1",
    // Defaults to strict. Operators with an internal CA opt out explicitly.
    tlsRejectUnauthorized: process.env.TF_LDAP_TLS_REJECT_UNAUTHORIZED !== "0",
    orgSlug: process.env.TF_LDAP_ORG_SLUG ?? "",
  };
}

/**
 * Substitutes `{{username}}` in a filter template with an RFC 4515-escaped
 * value. Exported for the selftest — the escaping is the security boundary that
 * keeps a username like `*)(uid=admin` from rewriting the filter.
 */
export function buildUserFilter(template: string, username: string): string {
  // ldapts exposes the RFC 4515 escaper as a template tag; tagging a lone
  // interpolation is how you get the escaped scalar out of it.
  const safe = escapeFilter`${username}`;
  return template.replace(/\{\{username\}\}/g, () => safe);
}

/** Reads an attribute that the directory may return as a string, array or Buffer. */
function attr(entry: Entry, name: string): string | null {
  const raw = entry[name];
  if (raw === undefined || raw === null) return null;
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first === undefined) return null;
  const value = Buffer.isBuffer(first) ? first.toString("utf8") : String(first);
  return value.trim() || null;
}

export type LdapUser = { dn: string; email: string; name: string };

/**
 * `ok` distinguishes "the directory says these credentials are wrong" from
 * "we could not reach/parse the directory". The caller shows the same generic
 * message either way, but only the latter is a server fault worth logging as one.
 */
export type LdapResult =
  | { ok: true; user: LdapUser }
  | { ok: false; reason: "credentials" | "not_found" | "no_email" | "error" };

/**
 * Authenticates `username`/`password` against the directory.
 *
 * Two binds by design: first as the service account (or anonymously) to find
 * the user's DN, then as that DN with the supplied password. We never construct
 * a DN by string-concatenating the username — only a DN the directory itself
 * returned is ever bound.
 */
export async function authenticateLdap(
  cfg: LdapConfig,
  username: string,
  password: string
): Promise<LdapResult> {
  // See the header note: an empty password would be an anonymous bind, which
  // succeeds against most directories and would authenticate anybody.
  if (!username || !password) return { ok: false, reason: "credentials" };

  const tlsOptions = { rejectUnauthorized: cfg.tlsRejectUnauthorized };
  // ldapts treats the mere *presence* of `tlsOptions` as "open this connection
  // with TLS" (Client.ts: `secure = isSecureProtocol || hasTlsOptions`), so it
  // must only be handed over for ldaps://. On a plain ldap:// URL it would make
  // the client start a TLS handshake the directory knows nothing about. StartTLS
  // is different: the upgrade happens after connecting, so those options go to
  // startTLS() below instead.
  const isLdaps = cfg.url.toLowerCase().startsWith("ldaps:");
  const clientOptions = {
    url: cfg.url,
    timeout: 10_000,
    connectTimeout: 10_000,
    ...(isLdaps && { tlsOptions }),
  };

  const search = new Client(clientOptions);
  let found: LdapUser | null = null;

  try {
    if (cfg.startTls) await search.startTLS(tlsOptions);
    // Anonymous lookup when no service account is configured.
    if (cfg.bindDn) await search.bind(cfg.bindDn, cfg.bindPassword);

    const { searchEntries } = await search.search(cfg.baseDn, {
      scope: "sub",
      filter: buildUserFilter(cfg.userFilter, username),
      attributes: ["dn", cfg.attrEmail, cfg.attrName],
      sizeLimit: 2,
    });

    // An ambiguous match means the filter is too loose; refusing is safer than
    // picking the first entry and binding as whoever that happens to be.
    if (searchEntries.length !== 1) {
      return { ok: false, reason: searchEntries.length === 0 ? "not_found" : "error" };
    }

    const entry = searchEntries[0];
    const email = attr(entry, cfg.attrEmail)?.toLowerCase() ?? null;
    if (!email) return { ok: false, reason: "no_email" };

    found = {
      dn: entry.dn,
      email,
      name: attr(entry, cfg.attrName) ?? email.split("@")[0],
    };
  } catch (e) {
    console.error("[ldap] lookup failed:", (e as Error).message);
    return { ok: false, reason: "error" };
  } finally {
    await search.unbind().catch(() => {});
  }

  // Second bind, on a fresh connection, as the user themselves. This is the
  // actual proof of the password.
  const verify = new Client(clientOptions);
  try {
    if (cfg.startTls) await verify.startTLS(tlsOptions);
    await verify.bind(found.dn, password);
    return { ok: true, user: found };
  } catch (e) {
    if (e instanceof InvalidCredentialsError) return { ok: false, reason: "credentials" };
    console.error("[ldap] user bind failed:", (e as Error).message);
    return { ok: false, reason: "error" };
  } finally {
    await verify.unbind().catch(() => {});
  }
}
