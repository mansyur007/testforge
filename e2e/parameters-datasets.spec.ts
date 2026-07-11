import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-13 Parameters/datasets: a case with {{var}} tokens in its steps + two
// dataset rows seeds two results in a new run, each with the row's values
// substituted (missing values render a ⚠{{var}} marker).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-14 Parameters/datasets: dataset rows seed one result each, substituted`, async ({
  page,
}) => {
  const ts = Date.now();
  const caseTitle = `Login as {{role}} ${ts}`;
  await login(page);

  // 1. Create a case whose step text uses {{role}} and {{username}}.
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  await page.fill('[data-testid="case-title-input"]', caseTitle);
  await page
    .locator('textarea[placeholder^="Action step"]')
    .first()
    .fill("Login as {{role}} with {{username}}");

  // 2. Parameters table appears once a {{var}} is discovered; add two rows.
  await expect(page.locator('[data-testid="dataset-table"]')).toBeVisible();
  await page.click('[data-testid="add-dataset-row"]');
  await page.click('[data-testid="add-dataset-row"]');
  const nameInputs = page.locator('[data-testid="dataset-name-input"]');
  await nameInputs.nth(0).fill("Admin row");
  await nameInputs.nth(1).fill("Guest row");
  const varInputs = page.locator('[data-testid="dataset-table"] tbody tr');
  // row 0: fill both vars; row 1: leave "username" empty to test the missing-var marker.
  await varInputs.nth(0).locator("input").nth(1).fill("Admin");
  await varInputs.nth(0).locator("input").nth(2).fill("root");
  await varInputs.nth(1).locator("input").nth(1).fill("Guest");

  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByRole("heading", { name: caseTitle })).toBeVisible();

  // 3. Create a run with just this case selected.
  const runName = `Dataset run ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', runName);
  await page.fill('input[placeholder="Search title..."]', caseTitle);
  await page.getByText(caseTitle).click();
  await page.click('button[type="submit"]');
  await page.waitForURL("**/runs/**");

  // 4. Two dataset rows -> two results, each with its own chip + substitution.
  await expect(page.locator('[data-testid="dataset-chip"]', { hasText: "Admin row" })).toBeVisible();
  await expect(page.locator('[data-testid="dataset-chip"]', { hasText: "Guest row" })).toBeVisible();

  await page.locator('[data-testid="dataset-chip"]', { hasText: "Admin row" }).click();
  await expect(page.locator('[data-testid="dataset-chip-detail"]')).toHaveText("Dataset: Admin row");
  await expect(page.getByText("Login as Admin with root")).toBeVisible();

  await page.locator('[data-testid="dataset-chip"]', { hasText: "Guest row" }).click();
  await expect(page.locator('[data-testid="dataset-chip-detail"]')).toHaveText("Dataset: Guest row");
  await expect(page.getByText("Login as Guest with ⚠{{username}}")).toBeVisible();
});
