import { test, expect } from "@playwright/test";
import { E2E } from "./global-setup";

// F-41 Instance console: the operator credential (static, from env) unlocks a
// read-only list of every registered user across organizations. Ordinary
// sessions must not reach it, and a wrong password must not either.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// Mirrors playwright.config.ts → webServer.command.
const SUPERADMIN_USER = "e2e-superadmin";
const SUPERADMIN_PASSWORD = "e2e-superadmin-password-long-enough";

test(`TC-${TC}-81 Instance console: operator sees every registered user`, async ({
  page,
}) => {
  // 1. Signed out → the console bounces to its own login, not the app's.
  await page.goto("/superadmin");
  await page.waitForURL("**/superadmin/login");

  // 2. Wrong password is rejected with a generic message.
  await page.fill('[data-testid="superadmin-username"]', SUPERADMIN_USER);
  await page.fill('[data-testid="superadmin-password"]', "wrong-password-here");
  await page.click('[data-testid="superadmin-submit"]');
  await expect(page.locator('[data-testid="superadmin-error"]')).toContainText(
    "Invalid credentials"
  );

  // 3. Correct credentials land on the list, which spans organizations: the
  //    seeded org admin and the org-less "Outsider" both appear.
  await page.fill('[data-testid="superadmin-username"]', SUPERADMIN_USER);
  await page.fill('[data-testid="superadmin-password"]', SUPERADMIN_PASSWORD);
  await page.click('[data-testid="superadmin-submit"]');
  await page.waitForURL("**/superadmin");

  const table = page.locator('[data-testid="superadmin-users"]');
  await expect(table).toContainText(E2E.email);
  await expect(table).toContainText("outsider@testforge.local");

  // 4. Search narrows to one row.
  await page.fill('[data-testid="superadmin-search"]', "outsider");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/superadmin?q=outsider*");
  await expect(table).toContainText("outsider@testforge.local");
  await expect(table).not.toContainText(E2E.email);

  // 5. CSV export is served to the operator session.
  const csv = await page.request.get("/superadmin/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("outsider@testforge.local");

  // 6. Sign out kills the cookie — and the export with it.
  await page.goto("/superadmin");
  await page.click('[data-testid="superadmin-logout"]');
  await page.waitForURL("**/superadmin/login");
  expect((await page.request.get("/superadmin/export")).status()).toBe(401);
});

test(`TC-${TC}-82 Instance console: an ordinary app session is not an operator`, async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // A logged-in org ADMIN is still not the instance operator.
  await page.goto("/superadmin");
  await page.waitForURL("**/superadmin/login");
  expect((await page.request.get("/superadmin/export")).status()).toBe(401);
});
