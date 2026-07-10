import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-05 Case history: every edit records a numbered revision with a per-field
// diff, a no-op save records nothing, and restoring an old revision writes a
// NEW revision instead of rewriting history (AC 1–3).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-14 Case history: revisions on edit, no-op skipped, restore`, async ({
  page,
}) => {
  const ts = Date.now();
  const title1 = `History case ${ts}`;
  const title2 = `History case renamed ${ts}`;
  const step1 = `Open the audit page ${ts}`;
  const step2 = `Open the revised audit page ${ts}`;
  await login(page);

  // 1. Create → rev 1 "created".
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  await page.fill('[data-testid="case-title-input"]', title1);
  await page.locator('textarea[placeholder^="Action step"]').first().fill(step1);
  await page.click('[data-testid="case-form-submit"]');
  // Wait for the detail heading before trusting page.url() (mid-redirect
  // /cases/new would also match "**/cases/**").
  await expect(page.getByRole("heading", { name: title1 })).toBeVisible();
  const caseUrl = page.url();

  // 2. Edit the title → rev 2 ("title").
  await page.goto(`${caseUrl}/edit`);
  await page.fill('[data-testid="case-title-input"]', title2);
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByRole("heading", { name: title2 })).toBeVisible();

  // 3. Edit a step → rev 3 ("steps").
  await page.goto(`${caseUrl}/edit`);
  await page.locator('textarea[placeholder^="Action step"]').first().fill(step2);
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByRole("heading", { name: title2 })).toBeVisible();

  // 4. No-op save → no new revision.
  await page.goto(`${caseUrl}/edit`);
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByRole("heading", { name: title2 })).toBeVisible();

  // 5. History lists exactly rev 3 / 2 / 1 with the right summaries + diffs.
  await page.click('[data-testid="case-tab-history"]');
  await expect(page.locator('[data-testid="revision-3"]')).toBeVisible();
  await expect(page.locator('[data-testid="revision-4"]')).toHaveCount(0);
  await expect(
    page.locator('[data-testid="revision-3"] [data-testid="revision-summary"]')
  ).toHaveText("steps");
  await expect(
    page.locator('[data-testid="revision-2"] [data-testid="revision-summary"]')
  ).toHaveText("title");
  await expect(
    page.locator('[data-testid="revision-1"] [data-testid="revision-summary"]')
  ).toHaveText("created");
  // Newest revision opens by default: steps diff shows old (removed) and new (added).
  await expect(page.getByText(step2).first()).toBeVisible();
  await expect(page.getByText(step1).first()).toBeVisible();

  // 6. Restore rev 1 → title back to the original, history gains rev 4.
  page.on("dialog", (d) => d.accept());
  await page.click('[data-testid="revision-1"] button');
  await page.click('[data-testid="revision-1"] [data-testid="revision-restore"]');
  await expect(
    page.locator('[data-testid="revision-4"] [data-testid="revision-summary"]')
  ).toHaveText("restored from rev 1");
  await page.click('[data-testid="case-tab-details"]');
  await expect(page.getByRole("heading", { name: title1 })).toBeVisible();

  // API view agrees: 4 revisions, newest first.
  const res = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases/${caseUrl.split("/").pop()}/revisions`
  );
  const body = await res.json();
  expect(body.items.map((r: { rev: number }) => r.rev)).toEqual([4, 3, 2, 1]);
  expect(body.items[0].snapshot.title).toBe(title1);
});
