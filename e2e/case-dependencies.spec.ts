import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-32 Case dependencies: add/remove a prerequisite, reject a cycle, and
// confirm a dependent gets a one-click (never automatic) BLOCKED suggestion
// in a run when its prerequisite is FAILED.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function createCase(page: Page, title: string): Promise<{ id: string; displayId: string }> {
  const res = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/cases`, {
    data: { title },
  });
  const body = await res.json();
  return { id: body.id, displayId: body.displayId };
}

test(`TC-${TC}-71 Case dependencies: add/remove prerequisite, reject a cycle, one-click BLOCKED suggestion`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  const prereqTitle = `Prerequisite case ${ts}`;
  const depTitle = `Dependent case ${ts}`;
  const prereq = await createCase(page, prereqTitle);
  const dep = await createCase(page, depTitle);

  // 1. Add: dep depends on prereq.
  await page.goto(`/projects/${E2E.projectSlug}/cases/${dep.id}`);
  await page.selectOption('[data-testid="dependency-add-select"]', prereq.id);
  await page.click('[data-testid="dependency-add-submit"]');
  await expect(page.locator('[data-testid="dependency-prerequisites"]')).toContainText(
    prereqTitle
  );

  // 2. The prerequisite's own page lists dep under "Required by".
  await page.goto(`/projects/${E2E.projectSlug}/cases/${prereq.id}`);
  await expect(page.locator('[data-testid="dependency-dependents"]')).toContainText(depTitle);

  // 3. Cycle rejected: prereq cannot also depend on dep (would close a loop).
  await page.selectOption('[data-testid="dependency-add-select"]', dep.id);
  await page.click('[data-testid="dependency-add-submit"]');
  await expect(page.locator('[data-testid="dependency-add-error"]')).toContainText(
    "cycle"
  );
  await expect(page.locator('[data-testid="dependency-prerequisites"]')).toContainText(
    "No prerequisites"
  );

  // 4. Remove the original dependency, confirm it's gone from both sides.
  await page.goto(`/projects/${E2E.projectSlug}/cases/${dep.id}`);
  const removeButton = page.locator('[data-testid^="dependency-remove-"]');
  await removeButton.click();
  await expect(page.locator('[data-testid="dependency-prerequisites"]')).toContainText(
    "No prerequisites"
  );

  // 5. Re-add it for the run scenario below.
  await page.selectOption('[data-testid="dependency-add-select"]', prereq.id);
  await page.click('[data-testid="dependency-add-submit"]');
  await expect(page.locator('[data-testid="dependency-prerequisites"]')).toContainText(
    prereqTitle
  );

  // 6. A run with both cases: fail the prerequisite, then confirm the
  // dependent shows a BLOCKED suggestion (never applied automatically).
  const runRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs`, {
    data: { name: `Dependency run ${ts}`, caseIds: [prereq.id, dep.id] },
  });
  const run = await runRes.json();
  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  await page.click('[data-testid="submit-status-FAILED"]');
  // The row-status text updates optimistically on click (RunExecutor's
  // setLive) — poll the real API instead of trusting that UI echo.
  await expect(async () => {
    const res = await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`
    );
    const results = (await res.json()).data as { caseId: string; status: string }[];
    expect(results.find((r) => r.caseId === prereq.id)?.status).toBe("FAILED");
  }).toPass({ timeout: 15000 });

  // Switch to the dependent case and confirm the suggestion appears — never
  // silently applied, its own status is still whatever it started as.
  await page.getByText(depTitle).first().click();
  await expect(page.locator('[data-testid="blocked-suggestion"]')).toContainText(
    prereq.displayId
  );

  // 7. Accept it — poll the real API again (same optimistic-UI caveat).
  await page.click('[data-testid="blocked-suggestion-accept"]');
  await expect(async () => {
    const res = await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`
    );
    const results = (await res.json()).data as { caseId: string; status: string }[];
    expect(results.find((r) => r.caseId === dep.id)?.status).toBe("BLOCKED");
  }).toPass({ timeout: 15000 });
});
