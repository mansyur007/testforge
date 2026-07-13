import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-17 Run comparison: build two runs over the same two cases via the API
// (case 1: PASSED -> FAILED = regression; case 2: FAILED -> PASSED = fixed),
// select both runs with the compare checkboxes on the runs list, and verify
// the comparison page's summary counts, per-row statuses and delta arrows.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-40 Run comparison: regressions & fixes between two runs`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. Two cases to compare across runs.
  const casesRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases`
  );
  const cases = (await casesRes.json()).data as {
    id: string;
    title: string;
  }[];
  const regressCase = cases.find(
    (c) => c.title === "Valid login redirects to dashboard"
  )!;
  const fixedCase = cases.find(
    (c) => c.title === "Change password succeeds"
  )!;
  expect(regressCase).toBeTruthy();
  expect(fixedCase).toBeTruthy();

  // 2. Run A: regressCase PASSED, fixedCase FAILED. Run B: the reverse.
  const mkRun = async (
    name: string,
    statuses: { caseId: string; status: string }[]
  ) => {
    const runRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs`,
      { data: { name, caseIds: statuses.map((s) => s.caseId) } }
    );
    const run = await runRes.json();
    for (const s of statuses) {
      const r = await page.request.post(
        `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
        { data: s }
      );
      expect(r.status()).toBe(200);
    }
    return run.id as string;
  };
  const runAId = await mkRun(`Compare A ${ts}`, [
    { caseId: regressCase.id, status: "PASSED" },
    { caseId: fixedCase.id, status: "FAILED" },
  ]);
  const runBId = await mkRun(`Compare B ${ts}`, [
    { caseId: regressCase.id, status: "FAILED" },
    { caseId: fixedCase.id, status: "PASSED" },
  ]);

  // 3. Runs list: check A then B, the compare bar appears, jump to the page.
  await page.goto(`/projects/${E2E.projectSlug}/runs`);
  await page.check(`[data-testid="compare-check-${runAId}"]`);
  await expect(page.locator('[data-testid="compare-bar"]')).toContainText(
    "Check one more run"
  );
  await page.check(`[data-testid="compare-check-${runBId}"]`);
  await page.click('[data-testid="compare-go"]');
  await page.waitForURL(`**/runs/compare?a=${runAId}&b=${runBId}`);

  // 4. Headers name both runs; summary counts one regression and one fix.
  await expect(page.getByText(`Compare A ${ts}`)).toBeVisible();
  await expect(page.getByText(`Compare B ${ts}`)).toBeVisible();
  await expect(page.locator('[data-testid="compare-regressions"]')).toHaveText(
    "↓ 1 regression"
  );
  await expect(page.locator('[data-testid="compare-fixes"]')).toHaveText(
    "↑ 1 fixed"
  );

  // 5. Rows: regressed case shows Pass -> Fail, fixed case the reverse.
  const regressRow = page.locator("tr", { hasText: regressCase.title });
  await expect(regressRow).toContainText("Regressed");
  const fixedRow = page.locator("tr", { hasText: fixedCase.title });
  await expect(fixedRow).toContainText("Fixed");
});
