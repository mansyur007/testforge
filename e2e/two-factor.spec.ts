import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";
import { totp } from "./fixtures/totp";

// F-20 two-factor authentication: enroll via the settings card, verify that a
// correct password alone no longer yields a session, complete the second step,
// use a recovery code, and disable. Uses the dedicated twofa@ account so the
// shared admin login the rest of the suite relies on is never touched.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function passwordLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('[data-testid="login-submit"]');
}

test(`TC-${TC}-38 2FA: enroll, gated second login step, recovery code, disable`, async ({
  page,
  context,
}) => {
  // --- Enroll ---
  await passwordLogin(page, E2E.twoFactorEmail, E2E.twoFactorPassword);
  await page.waitForURL("**/dashboard");
  await page.goto("/settings/account");

  await page.locator('[data-testid="enable-2fa"]').click();
  const secret = (await page.locator('[data-testid="totp-secret"]').innerText()).trim();
  expect(secret.length).toBeGreaterThan(10);
  await page.locator('[data-testid="totp-code"]').fill(totp(secret));
  await page.getByRole("button", { name: "Verify & turn on" }).click();

  // Recovery codes are shown exactly once.
  const codesList = page.locator('[data-testid="recovery-codes"] li');
  await expect(codesList).toHaveCount(10);
  const firstRecovery = (await codesList.first().innerText()).trim();
  expect(firstRecovery).toMatch(/^[0-9a-f]{5}-[0-9a-f]{5}$/);

  // --- Password alone no longer authenticates ---
  await context.clearCookies();
  await passwordLogin(page, E2E.twoFactorEmail, E2E.twoFactorPassword);
  await page.waitForURL("**/login/2fa");
  // No session cookie should exist yet — only the pending tf_2fa token.
  const midCookies = await context.cookies();
  expect(midCookies.find((c) => c.name === "tf_session")).toBeUndefined();
  expect(midCookies.find((c) => c.name === "tf_2fa")).toBeTruthy();

  // A wrong code is rejected; a correct one completes the login.
  await page.locator('[data-testid="verify-2fa-code"]').fill("000000");
  await page.locator('[data-testid="verify-2fa-submit"]').click();
  await expect(page.getByText(/not valid/i)).toBeVisible();
  await page.locator('[data-testid="verify-2fa-code"]').fill(totp(secret));
  await page.locator('[data-testid="verify-2fa-submit"]').click();
  await page.waitForURL("**/dashboard");
  expect((await context.cookies()).find((c) => c.name === "tf_session")).toBeTruthy();

  // --- Recovery code works once as the second factor ---
  await context.clearCookies();
  await passwordLogin(page, E2E.twoFactorEmail, E2E.twoFactorPassword);
  await page.waitForURL("**/login/2fa");
  await page.locator('[data-testid="verify-2fa-code"]').fill(firstRecovery);
  await page.locator('[data-testid="verify-2fa-submit"]').click();
  await page.waitForURL("**/dashboard");

  // The same recovery code is now spent.
  await context.clearCookies();
  await passwordLogin(page, E2E.twoFactorEmail, E2E.twoFactorPassword);
  await page.waitForURL("**/login/2fa");
  await page.locator('[data-testid="verify-2fa-code"]').fill(firstRecovery);
  await page.locator('[data-testid="verify-2fa-submit"]').click();
  await expect(page.getByText(/not valid/i)).toBeVisible();
  // Finish this login with a real TOTP so we can reach settings to disable.
  await page.locator('[data-testid="verify-2fa-code"]').fill(totp(secret));
  await page.locator('[data-testid="verify-2fa-submit"]').click();
  await page.waitForURL("**/dashboard");

  // --- Disable ---
  await page.goto("/settings/account");
  await page.locator('[data-testid="totp-code"]').fill(totp(secret));
  await page.getByRole("button", { name: "Disable" }).click();
  await expect(page.locator('[data-testid="enable-2fa"]')).toBeVisible();

  // Password login now goes straight through — no second step.
  await context.clearCookies();
  await passwordLogin(page, E2E.twoFactorEmail, E2E.twoFactorPassword);
  await page.waitForURL("**/dashboard");
});
