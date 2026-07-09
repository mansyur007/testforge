import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-09 Global search (⌘K): open with the shortcut, find by title fragment,
// rank exact display-id first, navigate on click, and never leak entities
// from projects the user is not a member of.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function openPalette(page: Page) {
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.locator('[data-testid="global-search-panel"]')).toBeVisible();
}

test(`TC-${TC}-7 Global search finds a case and navigates`, async ({ page }) => {
  await login(page);
  await openPalette(page);

  await page.fill('[data-testid="global-search-input"]', "Valid login redirects");
  const results = page.locator('[data-testid="global-search-result"]');
  await expect(results.first()).toContainText("Valid login redirects to dashboard");

  await results.first().click();
  await page.waitForURL("**/cases/**");
  await expect(
    page.getByRole("heading", { name: "Valid login redirects to dashboard" })
  ).toBeVisible();
});

test(`TC-${TC}-8 Exact display id ranks first`, async ({ page }) => {
  await login(page);
  await openPalette(page);

  // Canonical padded form (TC-E2E-002); the API also accepts unpadded input.
  await page.fill('[data-testid="global-search-input"]', `TC-${TC}-002`);
  const first = page.locator('[data-testid="global-search-result"]').first();
  await expect(first).toContainText("Language switcher on login");
  await expect(first).toContainText(`TC-${TC}-002`);
});

test(`TC-${TC}-9 Search never leaks other projects' entities`, async ({ page }) => {
  await login(page);
  await openPalette(page);

  // The fixture case exists in a project the e2e user is NOT a member of.
  await page.fill('[data-testid="global-search-input"]', "XyzzySecret");
  await expect(page.locator('[data-testid="global-search-empty"]')).toBeVisible();
  await expect(page.locator('[data-testid="global-search-result"]')).toHaveCount(0);

  // Sanity: 1-char input fires no search and shows the hint state instead.
  await page.fill('[data-testid="global-search-input"]', "X");
  await expect(page.locator('[data-testid="global-search-result"]')).toHaveCount(0);
});
