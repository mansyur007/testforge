import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-06 Test plans: a 2×2 config matrix creates exactly 4 named child runs with
// the selected cases (AC 1); no configs → 1 run and standalone runs keep
// working (AC 3); complete-plan closes every child run (AC 5).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-19 Plan with 2×2 matrix creates 4 runs; complete-plan closes them`, async ({
  page,
}) => {
  const ts = Date.now();
  const planName = `Matrix plan ${ts}`;
  await login(page);

  // Config axes via the API (the ConfigurationsManager UI is exercised in -20).
  const mkGroup = async (name: string, options: string[]) => {
    const res = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/config-groups`,
      { data: { name: `${name} ${ts}`, options } }
    );
    expect(res.status()).toBe(201);
    return res.json();
  };
  const browser = await mkGroup("Browser", ["Chrome", "Firefox"]);
  const os = await mkGroup("OS", ["Windows", "macOS"]);

  // 1. Build the plan in the UI: 2×2 options + 2 cases.
  await page.goto(`/projects/${E2E.projectSlug}/plans/new`);
  await page.fill('[data-testid="plan-name-input"]', planName);
  for (const g of [browser, os])
    for (const o of g.options)
      await page.check(`[data-testid="plan-option-${g.name}-${o.name}"]`);
  await expect(page.locator('[data-testid="plan-combo-preview"]')).toContainText(
    "Will create 4 runs"
  );
  await expect(page.locator('[data-testid="plan-combo-preview"]')).toContainText(
    "Chrome/Windows"
  );

  // Select the first two cases in the picker.
  const checkboxes = page.locator(
    'div.max-h-96 label:not(:first-child) input[type="checkbox"]'
  );
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.click('[data-testid="plan-form-submit"]');

  // 2. AC 1 — plan page shows 4 child runs named with their combos + aggregate bar.
  await expect(page.getByRole("heading", { name: planName })).toBeVisible();
  const planUrl = page.url();
  await expect(page.locator('[data-testid="plan-run-row"]')).toHaveCount(4);
  for (const combo of [
    "Chrome / Windows",
    "Chrome / macOS",
    "Firefox / Windows",
    "Firefox / macOS",
  ])
    await expect(
      page.getByRole("link", { name: `${planName} — ${combo}` })
    ).toBeVisible();
  await expect(page.locator('[data-testid="plan-matrix"]')).toBeVisible();

  // Each run is seeded with the 2 selected cases (API check on the first).
  const planId = planUrl.split("/").pop()!;
  const api = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/plans/${planId}`
  );
  const planBody = await api.json();
  expect(planBody.runs).toHaveLength(4);
  expect(planBody.stats.UNTESTED).toBe(8); // 4 runs × 2 cases
  // Find by name — creation order ties on createdAt at SQLite resolution.
  const chromeWin = planBody.runs.find((r: { name: string }) =>
    r.name.endsWith("Chrome / Windows")
  );
  expect(chromeWin.config).toEqual({
    [browser.name]: "Chrome",
    [os.name]: "Windows",
  });

  // 3. AC 5 — complete the plan; every child run flips to COMPLETED.
  page.on("dialog", (d) => d.accept());
  await page.click('[data-testid="plan-complete"]');
  await expect(page.getByText("Completed").first()).toBeVisible();
  const after = await (
    await page.request.get(`/api/v1/projects/${E2E.projectSlug}/plans/${planId}`)
  ).json();
  expect(after.status).toBe("COMPLETED");
  expect(after.completedAt).not.toBeNull();
  for (const run of after.runs) expect(run.status).toBe("COMPLETED");
});

test(`TC-${TC}-20 Plan without configs creates 1 run; standalone runs unaffected`, async ({
  page,
}) => {
  const ts = Date.now();
  const planName = `Configless plan ${ts}`;
  await login(page);

  // AC 3a — no options picked → exactly one run, no config chip.
  await page.goto(`/projects/${E2E.projectSlug}/plans/new`);
  await page.fill('[data-testid="plan-name-input"]', planName);
  await expect(page.locator('[data-testid="plan-combo-preview"]')).toContainText(
    "Will create 1 run"
  );
  await page
    .locator('div.max-h-96 label:not(:first-child) input[type="checkbox"]')
    .first()
    .check();
  await page.click('[data-testid="plan-form-submit"]');
  await expect(page.getByRole("heading", { name: planName })).toBeVisible();
  await expect(page.locator('[data-testid="plan-run-row"]')).toHaveCount(1);
  const api = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/plans/${page.url().split("/").pop()}`
  );
  expect((await api.json()).runs[0].config).toBeNull();

  // AC 3b — a standalone run created the old way still works and stays planless.
  const runName = `Standalone run ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', runName);
  await page
    .locator('div.max-h-96 label:not(:first-child) input[type="checkbox"]')
    .first()
    .check();
  await page.getByRole("button", { name: /Create Run/ }).click();
  await expect(page.getByRole("heading", { name: runName })).toBeVisible();
  const runId = page.url().split("/").pop()!;
  const runRes = await (
    await page.request.get(`/api/v1/projects/${E2E.projectSlug}/runs/${runId}`)
  ).json();
  expect(runRes.planId).toBeNull();
  expect(runRes.config).toBeNull();
});
