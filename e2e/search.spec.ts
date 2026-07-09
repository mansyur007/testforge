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
  // Retry the shortcut: on a slow CI runner the first press can land before
  // React hydration attaches the window keydown listener. If a press did
  // open the palette, the inner expect passes and we never press again.
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      page.locator('[data-testid="global-search-panel"]')
    ).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
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
  // Built from the fixture project's slug — NOT the TC test-name prefix,
  // which CI overrides via TF_PROJECT for prod title matching.
  const displayId = `TC-${E2E.projectSlug.toUpperCase()}-002`;
  await page.fill('[data-testid="global-search-input"]', displayId);
  const first = page.locator('[data-testid="global-search-result"]').first();
  await expect(first).toContainText("Language switcher on login");
  await expect(first).toContainText(displayId);
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
