import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// The TC-<SLUG>-<n> prefix follows the upload target so JUnit results match the
// right project's cases. Defaults to the local "e2e" fixture; set TF_PROJECT to
// the target slug (e.g. super-admin-tf) when uploading elsewhere.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page, password = E2E.password) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-1 Valid login redirects to dashboard`, async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test(`TC-${TC}-2 Language switcher on login`, async ({ page }) => {
  await page.goto("/login");
  const group = page.getByRole("group", { name: "Language" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("button", { name: "EN" })).toBeVisible();
  await expect(group.getByRole("button", { name: "ID" })).toBeVisible();
});

async function changePassword(page: Page, current: string, next: string) {
  await page.goto("/settings/account");
  await page.fill('input[name="currentPassword"]', current);
  await page.fill('input[name="newPassword"]', next);
  await page.fill('input[name="confirmPassword"]', next);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed successfully.")).toBeVisible();
}

test(`TC-${TC}-3 Change password succeeds`, async ({ page }) => {
  await login(page);

  await changePassword(page, E2E.password, "E2eDemo456");
  // Reload between changes: the form resets its fields on success (async), which
  // can race with filling them for the restore — leaving the password stuck at
  // the new value. Navigating fresh avoids that and makes the second success
  // banner a genuine confirmation rather than the stale first one.
  await changePassword(page, "E2eDemo456", E2E.password);

  // Prove the restore actually persisted: a fresh login with the original
  // password must still work (this is what kept breaking the next test).
  await page.goto("/login");
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
});

test(`TC-${TC}-4 Dashboard renders in English`, async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  await expect(page.getByText("Active Projects")).toBeVisible();
});
