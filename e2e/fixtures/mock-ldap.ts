import type { Server } from "node:net";

// F-34: a minimal in-process LDAP directory for the e2e, built on ldapjs
// (devDependency only — the app itself speaks LDAP through `ldapts`). It serves
// one service account and a couple of user entries, which is enough to exercise
// the real two-bind flow: service bind → subtree search → user bind.
//
// Mirrors the shape of mock-oidc.ts: start it in beforeAll, flip `config` per
// scenario, close it in afterAll.

export const LDAP_BASE_DN = "dc=testforge,dc=local";
export const LDAP_SERVICE_DN = `cn=svc,${LDAP_BASE_DN}`;
export const LDAP_SERVICE_PASSWORD = "svc-secret";

export type MockLdapUser = {
  uid: string;
  password: string;
  mail: string;
  cn: string;
};

export type MockLdapControls = {
  server: Server;
  url: string;
  config: {
    users: MockLdapUser[];
  };
  /**
   * Everything the directory was actually asked to do, in order. The negative
   * tests assert against this: "no session cookie" alone would also hold if the
   * app never contacted the directory at all, so they check that the expected
   * search/bind really reached it before concluding the refusal was meaningful.
   */
  log: { searchFilters: string[]; bindDns: string[] };
  reset: () => void;
  close: () => Promise<void>;
};

export async function startMockLdap(port: number): Promise<MockLdapControls> {
  // ldapjs is CommonJS and pulls in a lot; require it lazily so specs that
  // never touch LDAP don't pay for it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ldap = require("ldapjs");

  const config: MockLdapControls["config"] = {
    users: [
      {
        uid: "jdoe",
        password: "ldap-user-pw",
        mail: "jdoe@testforge.local",
        cn: "Jane Doe",
      },
    ],
  };

  const server = ldap.createServer();
  const log: MockLdapControls["log"] = { searchFilters: [], bindDns: [] };

  const dnOf = (uid: string) => `uid=${uid},ou=people,${LDAP_BASE_DN}`;

  // --- bind: the service account plus every configured user -----------------
  server.bind(LDAP_BASE_DN, (req: any, res: any, next: any) => {
    const dn = req.dn.toString().toLowerCase();
    const password = req.credentials ?? "";
    log.bindDns.push(dn);

    if (dn === LDAP_SERVICE_DN.toLowerCase()) {
      if (password !== LDAP_SERVICE_PASSWORD)
        return next(new ldap.InvalidCredentialsError());
      res.end();
      return next();
    }

    const user = config.users.find((u) => dnOf(u.uid).toLowerCase() === dn);
    // A real directory answers "invalid credentials" for both a wrong password
    // and an unknown DN — the app must not be able to tell them apart.
    if (!user || user.password !== password)
      return next(new ldap.InvalidCredentialsError());

    res.end();
    return next();
  });

  // --- search: subtree lookup honouring the client's filter ------------------
  server.search(LDAP_BASE_DN, (req: any, res: any, next: any) => {
    log.searchFilters.push(req.filter.toString());
    for (const user of config.users) {
      const attributes = {
        objectClass: ["inetOrgPerson"],
        uid: user.uid,
        cn: user.cn,
        mail: user.mail,
      };
      // req.filter.matches is ldapjs's own RFC 4515 evaluation — using it (as
      // opposed to matching on uid by hand) is what makes the escaping test
      // meaningful: an injected filter would have to actually match here.
      if (req.filter.matches(attributes)) {
        res.send({ dn: dnOf(user.uid), attributes });
      }
    }
    res.end();
    return next();
  });

  // ldapjs re-emits per-connection parser hiccups as server 'error' events —
  // ldapts's unbind teardown reliably trips one. Without a listener that is an
  // unhandled 'error' and Node tears the server down, so the directory would
  // serve exactly one login and then refuse every later connection.
  server.on("error", (err: Error) => {
    console.warn("[mock-ldap] ignoring connection error:", err.message);
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

  return {
    server,
    url: `ldap://127.0.0.1:${port}`,
    config,
    log,
    reset: () => {
      log.searchFilters.length = 0;
      log.bindDns.length = 0;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
