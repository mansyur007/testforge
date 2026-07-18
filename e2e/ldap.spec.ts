import { test, expect } from "@playwright/test";
import { startMockLdap, type MockLdapControls } from "./fixtures/mock-ldap";

// F-34 LDAP / Active Directory login, driven against an in-process mock
// directory bound to the fixed port the dev server is pointed at (see
// playwright.config.ts TF_LDAP_URL). Covers the happy path (real two-bind flow
// + auto-provision), a wrong password, and the filter-injection guard.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const MOCK_PORT = 9798;

let mock: MockLdapControls;

test.beforeAll(async () => {
  mock = await startMockLdap(MOCK_PORT);
});

test.afterAll(async () => {
  await mock.close();
});

async function submitLogin(page: import("@playwright/test").Page, user: string, pw: string) {
  await page.goto("/login");
  await page.locator('[data-testid="login-email"]').fill(user);
  await page.locator('[data-testid="login-password"]').fill(pw);
  await page.locator('button[type="submit"]').click();
}

/**
 * Waits for a *rejected* login to have actually round-tripped. The login form
 * stays on screen either way, so asserting on the form alone would race the
 * server action — the rendered error is the first proof that login() finished.
 */
async function expectLoginRejected(page: import("@playwright/test").Page) {
  await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
}

test(`TC-${TC}-79 LDAP: directory credentials log in and auto-provision`, async ({
  page,
  context,
}) => {
  await context.clearCookies();
  // The username is a bare uid, not an email — the form must accept it.
  await submitLogin(page, "jdoe", "ldap-user-pw");

  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  expect(page.url()).not.toContain("/login");
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeTruthy();
});

test(`TC-${TC}-79b LDAP: wrong directory password is refused`, async ({ page, context }) => {
  await context.clearCookies();
  mock.reset();
  await submitLogin(page, "jdoe", "definitely-not-the-password");

  await expectLoginRejected(page);
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeUndefined();
  // Non-vacuous guard: the refusal only means something if the app actually got
  // as far as binding to the directory as jdoe and was turned away there.
  expect(mock.log.bindDns).toContain("uid=jdoe,ou=people,dc=testforge,dc=local");
});

test(`TC-${TC}-79c LDAP: a filter-injection username cannot authenticate`, async ({
  page,
  context,
}) => {
  await context.clearCookies();
  mock.reset();
  // Unescaped, this would widen the search filter into one that matches jdoe.
  // RFC 4515 escaping must make it match nothing instead.
  await submitLogin(page, "*)(uid=jdoe", "ldap-user-pw");

  await expectLoginRejected(page);
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeUndefined();

  // Non-vacuous guard: the directory really was searched, and the metacharacters
  // arrived escaped (\2a \29 \28) rather than as live filter syntax — so the
  // refusal is the escaping working, not the request never being made.
  expect(mock.log.searchFilters).toHaveLength(1);
  expect(mock.log.searchFilters[0]).toContain("\\2a");
  expect(mock.log.searchFilters[0]).not.toContain("(uid=jdoe)");
  // Injection would have produced a match and therefore a user bind attempt.
  expect(mock.log.bindDns).not.toContain("uid=jdoe,ou=people,dc=testforge,dc=local");
});
