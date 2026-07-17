import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-28 Suite baselines: snapshot a suite (case + revision) as a named
// baseline, edit the case afterward, confirm "Compare to current" flags it
// CHANGED, then create a run "from baseline" and confirm the executor shows
// the PINNED (old) content, not the edited one.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-67 Baselines: snapshot, compare shows CHANGED, run from baseline pins old content`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. Isolated suite + case so the baseline's scope is small and deterministic
  // regardless of how many cases other specs have added to this shared project.
  const suiteRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/suites`, {
    data: { name: `Baseline Suite ${ts}` },
  });
  const suite = await suiteRes.json();
  const originalTitle = `Baseline case ${ts}`;
  const caseRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/cases`, {
    data: { title: originalTitle, suiteId: suite.id },
  });
  const testCase = await caseRes.json();

  // 2. Create the baseline scoped to that suite.
  const baselineName = `Baseline ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/baselines`);
  await page.fill('[data-testid="baseline-name-input"]', baselineName);
  await page.selectOption('[data-testid="baseline-suite-select"]', suite.id);
  await page.click('[data-testid="baseline-create-button"]');
  await page.waitForURL("**/baselines/**");
  const baselineUrl = page.url();
  const baselineId = baselineUrl.split("/baselines/")[1];

  // 3. Freshly captured — the case shows UNCHANGED.
  await expect(page.locator(`[data-testid="baseline-status-${testCase.id}"]`)).toHaveText(
    "UNCHANGED"
  );

  // 4. Edit the case's title (bumps its F-05 revision) after the snapshot.
  const editedTitle = `${originalTitle} (edited)`;
  const patchRes = await page.request.patch(
    `/api/v1/projects/${E2E.projectSlug}/cases/${testCase.id}`,
    { data: { title: editedTitle } }
  );
  expect(patchRes.status()).toBe(200);

  // 5. "Compare to current" now flags it CHANGED, with "title" listed.
  await page.goto(baselineUrl);
  await expect(page.locator(`[data-testid="baseline-status-${testCase.id}"]`)).toHaveText(
    "CHANGED"
  );
  await expect(
    page.locator(`[data-testid="baseline-compare-row-${testCase.id}"]`)
  ).toContainText("title");

  // 6. Create a run "from baseline" — it should select the baseline's case(s)
  // automatically and pin caseRev to what the baseline captured.
  const runName = `Baseline run ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', runName);
  await page.selectOption('[data-testid="run-baseline-select"]', baselineId);
  await page.click('button[type="submit"]');
  // "**/runs/**" would also match the starting /runs/new URL.
  await page.waitForURL(/\/runs\/(?!new)[^/?#]+$/);

  // 7. The run carries the baseline badge and renders the OLD title, not the
  // edited one — pinning only means anything if the tester sees old content.
  await expect(page.locator('[data-testid="run-detail-baseline-badge"]')).toContainText(
    baselineName
  );
  await expect(page.getByText(originalTitle, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(editedTitle)).toHaveCount(0);

  // 8. Delete the baseline — it disappears from the list (the run it created
  // is untouched; TestRun.baselineId just sets null per the schema's onDelete).
  await page.goto(baselineUrl);
  await page.click('[data-testid="baseline-delete-button"]');
  await page.waitForURL("**/baselines");
  await expect(page.locator(`[data-testid="baseline-row-${baselineName}"]`)).toHaveCount(0);
});
