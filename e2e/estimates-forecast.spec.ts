import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-23 Estimates & forecast: flexible duration parsing on the case form,
// run-level total estimate + actual elapsed + forecast-to-complete, and
// plan-level roll-up (sum of child runs).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function createCaseWithEstimate(
  page: Page,
  title: string,
  estimate: string
) {
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  await page.fill('[data-testid="case-title-input"]', title);
  await page.fill('[data-testid="case-estimate-input"]', estimate);
  await page.click('[data-testid="case-form-submit"]');
  // "**/cases/**" also matches the /cases/new page itself, so wait for a URL
  // that has moved past it (a real caseId segment).
  await page.waitForURL((url) => /\/cases\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"));
  return page.url().split("/").pop()!;
}

test(`TC-${TC}-30 Estimates: "90" / "1m 30s" / "1:30" all parse to the same value; invalid input errors`, async ({
  page,
}) => {
  const title = `Estimate parse case ${Date.now()}`;
  await login(page);

  const caseId = await createCaseWithEstimate(page, title, "90");
  await expect(page.locator('[data-testid="case-estimate-badge"]')).toHaveText(
    "⏱ 1m 30s"
  );

  // Edit form re-displays the stored value in the same compact format.
  await page.goto(`/projects/${E2E.projectSlug}/cases/${caseId}/edit`);
  await expect(page.locator('[data-testid="case-estimate-input"]')).toHaveValue(
    "1m 30s"
  );

  // Colon format round-trips to the same 90s.
  await page.fill('[data-testid="case-estimate-input"]', "1:30");
  await page.click('[data-testid="case-form-submit"]');
  await page.waitForURL(`**/cases/${caseId}`);
  await expect(page.locator('[data-testid="case-estimate-badge"]')).toHaveText(
    "⏱ 1m 30s"
  );

  // Unparseable text is rejected with a form error, not silently dropped.
  await page.goto(`/projects/${E2E.projectSlug}/cases/${caseId}/edit`);
  await page.fill('[data-testid="case-estimate-input"]', "not a duration");
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByText(/Invalid estimate/)).toBeVisible();
});

test(`TC-${TC}-31 Run page: total estimate, actual elapsed so far, and forecast-to-complete`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  const caseAId = await createCaseWithEstimate(page, `Estimate A ${ts}`, "1m");
  const caseBId = await createCaseWithEstimate(page, `Estimate B ${ts}`, "2m");

  const runName = `Estimate run ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', runName);
  for (const title of [`Estimate A ${ts}`, `Estimate B ${ts}`, "Change password succeeds"])
    await page
      .locator('div.max-h-96 label', { hasText: title })
      .locator('input[type="checkbox"]')
      .check();
  await page.getByRole("button", { name: /Create Run/ }).click();
  await expect(page.getByRole("heading", { name: runName })).toBeVisible();
  const runId = page.url().split("/").pop()!;

  // Before any execution: total estimate sums the 2 cases with an estimate
  // (1m + 2m = 3m); the third case has none. No elapsed yet, but a forecast
  // is shown since all 3 are still UNTESTED.
  const summary = page.locator('[data-testid="run-estimate-summary"]');
  await expect(summary).toContainText("Estimate:");
  await expect(summary).toContainText("3m");
  await expect(summary).not.toContainText("Elapsed:");
  await expect(page.locator('[data-testid="run-forecast"]')).toContainText(
    /≈.*remaining/
  );

  // Record an actual result for case A via the results API (deterministic
  // elapsedSeconds, avoiding UI-timer flakiness).
  const post = (caseId: string, elapsedSeconds: number) =>
    page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs/${runId}/results`,
      { data: { caseId, status: "PASSED", elapsedSeconds } }
    );
  expect((await post(caseAId, 200)).status()).toBe(200);

  await page.reload();
  await expect(summary).toContainText("Elapsed:");
  await expect(summary).toContainText("3m 20s"); // 200s
  await expect(summary).toContainText("3m"); // total estimate unchanged
  await expect(page.locator('[data-testid="run-forecast"]')).toBeVisible(); // B + case3 remain

  // Execute the rest — forecast disappears once nothing is left UNTESTED.
  expect((await post(caseBId, 50)).status()).toBe(200);
  const thirdCaseRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?q=${encodeURIComponent("Change password succeeds")}`
  );
  const thirdCaseId = (await thirdCaseRes.json()).data[0].id;
  expect((await post(thirdCaseId, 30)).status()).toBe(200);

  await page.reload();
  await expect(page.locator('[data-testid="run-forecast"]')).toHaveCount(0);
});

test(`TC-${TC}-32 Plan roll-up sums the estimate/elapsed/forecast of its child runs`, async ({
  page,
}) => {
  const ts = Date.now();
  const title = `Estimate plan case ${ts}`;
  await login(page);
  await createCaseWithEstimate(page, title, "45s");

  const planName = `Estimate plan ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/plans/new`);
  await page.fill('[data-testid="plan-name-input"]', planName);
  await page
    .locator('div.max-h-96 label', { hasText: title })
    .locator('input[type="checkbox"]')
    .check();
  await page.click('[data-testid="plan-form-submit"]');
  await expect(page.getByRole("heading", { name: planName })).toBeVisible();

  // A configless plan creates exactly 1 child run — the roll-up should match
  // that single run's own totals (45s estimate, forecast still pending).
  const summary = page.locator('[data-testid="plan-estimate-summary"]');
  await expect(summary).toContainText("Estimate:");
  await expect(summary).toContainText("45s");
  await expect(page.locator('[data-testid="plan-forecast"]')).toContainText(
    /≈.*remaining/
  );
});
