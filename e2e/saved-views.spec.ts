import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-10 Saved views: save the current filter set as a named view, re-apply it
// from the Views menu, auto-apply a default view on a param-less visit, and
// clear it via the "All cases" pseudo-view. Runs sequentially (workers: 1).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// Fixture rows (global-setup): seq 1 "Valid login…" is HIGH; seq 2
// "Language switcher…" is LOW — a priority=HIGH filter separates them.
const HIGH_CASE = "Valid login redirects to dashboard";
const LOW_CASE = "Language switcher on login";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

// Click-open with retry: on slow CI runners the first click can land before
// hydration attaches the handler (same lesson as the ⌘K palette).
async function openMenu(page: Page) {
  await expect(async () => {
    await page.click('[data-testid="saved-views-trigger"]');
    await expect(
      page.locator('[data-testid="saved-views-panel"]')
    ).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

// The cases table paginates client-side at 25 rows by default (resets on
// every navigation). The e2e project accumulates cases from every other spec
// that runs before this one, so an unfiltered view can easily exceed one page
// by the time this spec runs — widen it before asserting a fixture row is
// visible on the unfiltered list (same fix as bulk-copy-reorder.spec.ts).
async function showAllRows(page: Page) {
  await page.selectOption('[data-testid="cases-page-size"]', "100");
}

test(`TC-${TC}-10 Save a view and re-apply it`, async ({ page }) => {
  // Unique per run — the local e2e DB persists, duplicate names would trip
  // Playwright's strict mode on re-runs.
  const name = `High only ${Date.now()}`;
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}?priority=HIGH`);

  await openMenu(page);
  await page.click('[data-testid="saved-view-new"]');
  await page.fill('[data-testid="saved-view-name"]', name);
  await page.click('[data-testid="saved-view-save"]');
  await expect(
    page.locator('[data-testid="saved-view-item"]', { hasText: name })
  ).toBeVisible();

  // Leave the filter, then bring it back through the view.
  await page.goto(`/projects/${E2E.projectSlug}?v=all`);
  await showAllRows(page);
  await expect(page.getByRole("link", { name: LOW_CASE })).toBeVisible();

  await openMenu(page);
  await page
    .locator('[data-testid="saved-view-item"]', { hasText: name })
    .click();
  await page.waitForURL("**priority=HIGH**");
  expect(page.url()).toContain("v=");
  await expect(page.getByRole("link", { name: HIGH_CASE })).toBeVisible();
  await expect(page.getByRole("link", { name: LOW_CASE })).toHaveCount(0);
});

test(`TC-${TC}-11 Default view auto-applies and All cases clears it`, async ({
  page,
}) => {
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}?priority=HIGH`);

  // Save a second view marked as default.
  const name = `Default high ${Date.now()}`;
  await openMenu(page);
  await page.click('[data-testid="saved-view-new"]');
  await page.fill('[data-testid="saved-view-name"]', name);
  await page.check('input[name="isDefault"]');
  await page.click('[data-testid="saved-view-save"]');
  await expect(
    page.locator('[data-testid="saved-view-item"]', { hasText: name })
  ).toBeVisible();

  // A param-less visit redirects into the default view…
  await page.goto(`/projects/${E2E.projectSlug}`);
  await page.waitForURL("**priority=HIGH**");
  await expect(page.getByRole("link", { name: LOW_CASE })).toHaveCount(0);

  // …and "All cases" suppresses it.
  await openMenu(page);
  await page.click('[data-testid="saved-view-all"]');
  await page.waitForURL("**v=all**");
  await showAllRows(page);
  await expect(page.getByRole("link", { name: LOW_CASE })).toBeVisible();

  // Cleanup: unstar so later param-less visits stay unredirected. There is
  // exactly one default at a time, so its "Unset default" star is unique;
  // waiting for it to disappear proves the server action committed before we
  // navigate (otherwise the goto races the POST).
  await openMenu(page);
  await page.getByTitle("Unset default").click();
  await expect(page.getByTitle("Unset default")).toHaveCount(0);
  await page.goto(`/projects/${E2E.projectSlug}`);
  await showAllRows(page);
  await expect(page.getByRole("link", { name: LOW_CASE })).toBeVisible();
});
