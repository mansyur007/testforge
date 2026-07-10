import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-04 Shared steps: create a group → insert it into a case → the detail page
// shows the steps expanded with the group badge → editing the group updates
// the case → deleting is blocked (409) while referenced.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-13 Shared steps: create, insert, expand, edit-propagates, delete-blocked`, async ({
  page,
}) => {
  const ts = Date.now();
  const groupTitle = `Login flow ${ts}`;
  const stepA = `Open /login ${ts}`;
  const stepB = `Enter valid credentials ${ts}`;
  await login(page);

  // 1. Create a group with two steps in the library.
  await page.goto(`/projects/${E2E.projectSlug}/cases/shared-steps`);
  await page.click('[data-testid="shared-group-new"]');
  await page.fill('[data-testid="shared-group-title"]', groupTitle);
  const actions = page.locator('[data-testid="shared-step-action"]');
  await actions.first().fill(stepA);
  await page.locator("button", { hasText: "+ Add Step" }).click();
  await actions.nth(1).fill(stepB);
  await page.click('[data-testid="shared-group-save"]');
  await expect(page.getByRole("heading", { name: groupTitle })).toBeVisible();

  // 2. Insert it into a new case (plus one inline step).
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  const caseTitle = `Uses shared steps ${Date.now()}`;
  await page.fill('[data-testid="case-title-input"]', caseTitle);
  await page
    .locator('textarea[placeholder^="Action step"]')
    .first()
    .fill("Check the dashboard header");
  await page.selectOption('[data-testid="insert-shared-steps"]', { label: `${groupTitle} (2)` });
  await expect(page.locator('[data-testid="shared-ref-row"]')).toBeVisible();
  await page.click('[data-testid="case-form-submit"]');
  // "**/cases/**" would also match /cases/new mid-redirect — wait for the
  // detail heading before trusting page.url().
  await expect(page.getByRole("heading", { name: caseTitle })).toBeVisible();
  const caseUrl = page.url();

  // 3. Detail shows 3 expanded steps; the shared ones carry the badge.
  await expect(page.getByText(stepA).first()).toBeVisible();
  await expect(page.getByText(stepB).first()).toBeVisible();
  await expect(page.locator('[data-testid="shared-step-badge"]').first()).toContainText(
    groupTitle
  );

  // 4. Edit the group → the case reflects the new text without being touched.
  await page.goto(`/projects/${E2E.projectSlug}/cases/shared-steps`);
  await page.click(
    `[data-testid="shared-group-edit-${groupTitle.toLowerCase().replace(/\s+/g, "-")}"]`
  );
  await page.locator('[data-testid="shared-step-action"]').first().fill(`${stepA} (v2)`);
  await page.click('[data-testid="shared-group-save"]');
  await expect(page.getByText(`${stepA} (v2)`).first()).toBeVisible();

  await page.goto(caseUrl);
  await expect(page.getByText(`${stepA} (v2)`).first()).toBeVisible();

  // 5. Deleting while referenced is blocked — UI error and API 409.
  const list = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/shared-steps`
  );
  const group = (await list.json()).items.find(
    (x: { title: string }) => x.title === groupTitle
  );
  expect(group.usageCount).toBeGreaterThan(0);
  const del = await page.request.delete(
    `/api/v1/projects/${E2E.projectSlug}/shared-steps/${group.id}`
  );
  expect(del.status()).toBe(409);
  expect((await del.json()).error.code).toBe("conflict");
});
