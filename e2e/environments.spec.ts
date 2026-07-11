import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-19 Environments: create one on the Fields page, tag a run with it at
// creation, see the badge + filter chip on the runs list and run detail,
// and confirm &env=<name> on an automation upload auto-creates one.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-28 Environments: create, tag a run, badge + filter chip`, async ({
  page,
}) => {
  const ts = Date.now();
  const envName = `QA-Env ${ts}`;
  const runName = `Tagged run ${ts}`;
  await login(page);

  // 1. Create the environment on the Fields page.
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await page.fill('[data-testid="environment-name-input"]', envName);
  await page.click('button:has-text("+ Environment")');
  await expect(page.locator(`[data-testid="environment-row-${envName}"]`)).toBeVisible();

  // 2. Create a run tagged with it.
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', runName);
  await page.selectOption('[data-testid="run-environment-select"]', { label: envName });
  await page
    .locator('div.max-h-96 label', { hasText: "Valid login redirects to dashboard" })
    .locator('input[type="checkbox"]')
    .check();
  await page.click('button[type="submit"]');
  await page.waitForURL("**/runs/**");
  await expect(page.locator('[data-testid="run-detail-env-badge"]')).toHaveText(envName);

  // 3. Runs list shows the badge and the filter chip narrows to it.
  await page.goto(`/projects/${E2E.projectSlug}/runs`);
  await expect(
    page.locator('[data-testid="run-env-badge"]', { hasText: envName }).first()
  ).toBeVisible();
  await page.click(`[data-testid="env-filter-${envName}"]`);
  await expect(page).toHaveURL(/env=/);
  await expect(page.getByText(runName)).toBeVisible();
});

test(`TC-${TC}-29 Environments: &env= on automation upload auto-creates one`, async ({
  page,
}) => {
  await login(page);
  const envName = `auto-env-${Date.now()}`;
  const fixture = fs.readFileSync(
    path.join(__dirname, "fixtures/results/junit.xml"),
    "utf8"
  );

  const res = await page.request.post(
    `/api/v1/results?project=${E2E.projectSlug}&name=env%20auto-create%20${Date.now()}&format=junit&env=${envName}`,
    { data: fixture, headers: { "Content-Type": "application/xml" } }
  );
  expect(res.status(), await res.text()).toBe(201);
  const body = await res.json();
  expect(body.environmentId).toBeTruthy();

  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await expect(page.locator(`[data-testid="environment-row-${envName}"]`)).toBeVisible();
});
