import { test, expect } from "@playwright/test";
import { startMockOidc, type MockOidcControls } from "./fixtures/mock-oidc";

// F-20 OIDC single sign-on, driven against a local mock IdP bound to the fixed
// port the dev server is pointed at (see playwright.config.ts TF_OIDC_ISSUER).
// Covers the happy path (auto-provision + session), the nonce-tamper rejection,
// and the email_verified guard.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const MOCK_PORT = 9797;

let mock: MockOidcControls;

test.beforeAll(async () => {
  mock = await startMockOidc(MOCK_PORT);
});

test.afterAll(async () => {
  await mock.close();
});

test(`TC-${TC}-39 OIDC: SSO button logs in and auto-provisions`, async ({ page, context }) => {
  mock.config.emailVerified = true;
  mock.config.tamperNonce = false;

  await context.clearCookies();
  await page.goto("/login");
  await expect(page.locator('[data-testid="sso-login"]')).toBeVisible();
  await page.locator('[data-testid="sso-login"]').click();

  // Ends on an authenticated page (new user → onboarding, returning → dashboard).
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  expect(page.url()).not.toContain("/login");
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeTruthy();
});

test(`TC-${TC}-39b OIDC: tampered nonce is rejected`, async ({ page, context }) => {
  mock.config.emailVerified = true;
  mock.config.tamperNonce = true;

  await context.clearCookies();
  await page.goto("/api/auth/oidc");
  await page.waitForURL("**/login**");
  await expect(page.getByText(/sign-on failed/i)).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeUndefined();
});

test(`TC-${TC}-39c OIDC: unverified email is refused`, async ({ page, context }) => {
  mock.config.emailVerified = false;
  mock.config.tamperNonce = false;

  await context.clearCookies();
  await page.goto("/api/auth/oidc");
  await page.waitForURL("**/login**");
  await expect(page.getByText(/verified your email/i)).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeUndefined();
});
