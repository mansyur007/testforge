import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-03 Custom fields: admin defines a required dropdown → the case form
// enforces it → the value shows on the detail page and in the CSV export and
// API → disabling the def hides it from forms but keeps old values visible.
// The field key is unique per run (defs persist in the local DB); the spec
// ends by disabling the field so later specs' case creation stays unaffected
// (global-setup also disables leftovers as crash recovery).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-12 Custom field lifecycle: define, enforce, display, export, disable`, async ({
  page,
}) => {
  const key = `comp_${Date.now()}`;
  await login(page);

  // 1. Define a required DROPDOWN on the Fields tab.
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await page.selectOption('[data-testid="field-type"]', "DROPDOWN");
  await page.fill('[data-testid="field-label"]', "Component");
  await page.fill('[data-testid="field-key"]', key);
  await page.fill('[data-testid="field-options"]', "api, web, mobile");
  await page.check('[data-testid="field-required"]');
  await page.click('[data-testid="field-create"]');
  await expect(page.locator(`[data-testid="field-toggle-${key}"]`)).toBeVisible();

  // 2. The new-case form renders it and enforces required.
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  const title = `Custom field demo ${Date.now()}`;
  await page.fill('[data-testid="case-title-input"]', title);
  await page
    .locator('textarea[placeholder^="Action step"]')
    .first()
    .fill("Open the page");
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByText("Component is required")).toBeVisible();

  // 3. With a value it saves, and the detail page shows it.
  await page.selectOption(`[data-testid="custom-${key}"]`, "web");
  await page.click('[data-testid="case-form-submit"]');
  await page.waitForURL("**/cases/**");
  const panel = page.locator('[data-testid="custom-fields-panel"]');
  await expect(panel).toContainText("Component");
  await expect(panel).toContainText("web");

  // 4. CSV export carries a cf_<key> column with the value.
  const csv = await page.request.get(`/api/export/cases?project=${E2E.projectSlug}`);
  expect(csv.status()).toBe(200);
  const text = await csv.text();
  expect(text).toContain(`cf_${key}`);
  expect(text).toContain("web");

  // 5. API rejects a value outside the options with 422 + field detail.
  const bad = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { data: { title: "bad custom", custom: { [key]: "desktop" } } }
  );
  expect(bad.status()).toBe(422);
  const body = await bad.json();
  expect(JSON.stringify(body.error.details)).toContain(`custom.${key}`);

  // 6. Disable the def: gone from the form, old value still renders.
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await page.click(`[data-testid="field-toggle-${key}"]`);
  await expect(page.locator(`[data-testid="field-toggle-${key}"]`)).toHaveText("Enable");

  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  await expect(page.locator(`[data-testid="custom-${key}"]`)).toHaveCount(0);
});
