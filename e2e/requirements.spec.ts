import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-18 Requirements & traceability: create a requirement, link a case (status
// derives to COVERED), record a PASSED result via the API, and confirm the
// traceability matrix buckets it under Pass. Also covers CSV import and the
// CSV export endpoint.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-44 Requirements: link → COVERED → matrix Pass, CSV import/export`, async ({
  page,
}) => {
  const ts = Date.now();
  const refId = `REQ-E2E-${ts}`;
  await login(page);

  // 1. Create a requirement.
  await page.goto(`/projects/${E2E.projectSlug}/requirements`);
  await page.fill('[data-testid="req-refid-input"]', refId);
  await page.fill('[data-testid="req-title-input"]', `Login requirement ${ts}`);
  await page.click('[data-testid="req-create-button"]');
  await expect(page.locator(`[data-testid="req-row-${refId}"]`)).toBeVisible();
  // No cases yet → OPEN.
  await expect(page.locator(`[data-testid="req-status-${refId}"]`)).toHaveText(
    "OPEN"
  );

  // 2. Open detail, link the first project case → derives to COVERED.
  await page.click(`[data-testid="req-row-${refId}"] a`);
  await page.waitForURL("**/requirements/**");
  await page.click('[data-testid="req-link-button"]');
  await expect(page.getByText("Status:")).toContainText("COVERED");

  // Grab the linked case's display id + real id for the API call.
  const caseRow = page.locator('[data-testid^="req-case-"]').first();
  await expect(caseRow).toBeVisible();
  const caseHref = await caseRow.locator("a").getAttribute("href");
  const caseId = caseHref!.split("/cases/")[1];

  // 3. Record a PASSED result for that case via the API.
  const runRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { data: { name: `Req run ${ts}`, caseIds: [caseId] } }
  );
  const run = await runRes.json();
  const resRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
    { data: { caseId, status: "PASSED" } }
  );
  expect(resRes.status()).toBe(200);

  // 4. Matrix: this requirement's Pass column shows 1.
  await page.goto(`/projects/${E2E.projectSlug}/requirements/matrix`);
  await expect(
    page.locator(`[data-testid="matrix-${refId}-Pass"]`)
  ).toHaveText("1");

  // 5. CSV export returns a row for this requirement.
  const csv = await page.request.get(
    `/api/export/requirements-matrix?project=${E2E.projectSlug}`
  );
  expect(csv.status()).toBe(200);
  const body = await csv.text();
  expect(body).toContain(refId);

  // 6. CSV import creates a new requirement.
  const importRef = `REQ-IMP-${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/requirements`);
  await page.fill(
    '[data-testid="req-csv-input"]',
    `refId,title,description\n${importRef},Imported req ${ts},from csv`
  );
  await page.click('[data-testid="req-import-button"]');
  await expect(
    page.locator(`[data-testid="req-row-${importRef}"]`)
  ).toBeVisible();
});
