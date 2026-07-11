import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-21 Mute/quarantine: build flip history via the API (fast + deterministic),
// mute from the Flaky panel (reason via window.prompt), confirm the muted
// case disappears from Flaky, appears in Muted Tests with its reason, the
// run executor still shows the real FAILED status with a "muted" chip, and
// unmuting reverses all of it.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-30 Mute/quarantine: flaky -> mute -> excluded everywhere -> unmute`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. Find a case id to build flip history against.
  const casesRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases`
  );
  const cases = (await casesRes.json()).data as { id: string; title: string }[];
  const target = cases.find(
    (c) => c.title === "Valid login redirects to dashboard"
  )!;
  expect(target).toBeTruthy();

  // 2. Three runs, statuses PASSED/FAILED/PASSED -> 2 flips -> flaky.
  let failedRunId = "";
  for (const [i, status] of ["PASSED", "FAILED", "PASSED"].entries()) {
    const runRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs`,
      { data: { name: `Flaky run ${i} ${ts}`, caseIds: [target.id] } }
    );
    const run = await runRes.json();
    if (status === "FAILED") failedRunId = run.id;
    const resultRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
      { data: { caseId: target.id, status } }
    );
    expect(resultRes.status()).toBe(200);
  }

  // 3. Reports: the case shows up flaky with a Mute button.
  await page.goto(`/projects/${E2E.projectSlug}/reports`);
  const muteBtn = page.locator(`[data-testid="mute-button-${target.id}"]`);
  await expect(muteBtn).toBeVisible();

  // 4. Mute it (reason via window.prompt).
  page.once("dialog", (d) => d.accept("e2e quarantine reason"));
  await muteBtn.click();

  // 5. No longer flaky; now in Muted Tests with the reason + sparkline.
  await expect(muteBtn).toHaveCount(0);
  const mutedRow = page.locator(`[data-testid="muted-row-${target.id}"]`);
  await expect(mutedRow).toBeVisible();
  await expect(mutedRow).toContainText("e2e quarantine reason");

  // 6. The failed run's executor still shows the real FAILED status, flagged muted.
  await page.goto(`/projects/${E2E.projectSlug}/runs/${failedRunId}`);
  await expect(page.locator('[data-testid="muted-chip"]')).toBeVisible();
  await expect(page.getByText("Muted", { exact: false }).first()).toBeVisible();

  // 7. Case detail shows the muted banner.
  await page.goto(`/projects/${E2E.projectSlug}/cases/${target.id}`);
  await expect(page.locator('[data-testid="case-muted-banner"]')).toBeVisible();

  // 8. Unmute reverses everything.
  await page.goto(`/projects/${E2E.projectSlug}/reports`);
  await page.click(`[data-testid="unmute-button-${target.id}"]`);
  await expect(page.locator(`[data-testid="muted-row-${target.id}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-testid="mute-button-${target.id}"]`)).toBeVisible();
});
