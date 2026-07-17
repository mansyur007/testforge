import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-27 BDD/Gherkin: import a .feature file (one scenario = one case, tags →
// tags), confirm the case detail page renders a syntax-highlighted Gherkin
// block instead of a steps table, create/edit a Gherkin case by hand through
// the case form's format toggle, and export .feature back out.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-66 Gherkin: import .feature, syntax-highlighted detail, create/edit round-trip, export`, async ({
  page,
}) => {
  await login(page);

  // 1. Import a .feature file — one Feature, two Scenarios, tags on one.
  await page.goto(`/projects/${E2E.projectSlug}/import?tab=gherkin`);
  const feature = fs.readFileSync(
    path.join(__dirname, "fixtures/import/sample.feature"),
    "utf8"
  );
  await page.setInputFiles('[data-testid="import-file-gherkin"]', {
    name: "sample.feature",
    mimeType: "text/plain",
    buffer: Buffer.from(feature),
  });
  await page.click('[data-testid="import-preview-gherkin"]');
  await expect(page.locator('[data-testid="import-preview-result-gherkin"]')).toContainText(
    "2 cases across"
  );
  await page.click('[data-testid="import-commit-gherkin"]');
  await expect(page.locator('[data-testid="import-message-gherkin"]')).toContainText(
    "2 test cases imported"
  );

  // 2. Find the imported case and confirm the detail page renders a Gherkin
  // block (not a steps table) with the scenario body and imported tags.
  const casesRes = await page.request.get(`/api/v1/projects/${E2E.projectSlug}/cases`);
  const cases = (await casesRes.json()).data as { id: string; title: string; tags: string }[];
  const imported = cases.find((c) => c.title === "Valid credentials log the user in");
  expect(imported).toBeTruthy();
  expect(imported!.tags.split(",")).toEqual(expect.arrayContaining(["smoke", "auth"]));

  await page.goto(`/projects/${E2E.projectSlug}/cases/${imported!.id}`);
  await expect(page.getByText("Scenario (Gherkin)")).toBeVisible();
  const block = page.locator('[data-testid="gherkin-block"]');
  await expect(block).toContainText("Given the user is on the login page");
  await expect(block).toContainText("When they submit a valid email and password");
  await expect(block).toContainText("Then they land on the dashboard");
  // Background steps are deliberately not imported into the case.
  await expect(block).not.toContainText("the app is running");

  // 3. Manually create a new Gherkin case via the format toggle.
  const ts = Date.now();
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);
  await page.fill('input[name="title"]', `Manual Gherkin case ${ts}`);
  await page.click('[data-testid="case-format-gherkin"]');
  const gherkinBody = `Given a manual scenario ${ts}\nWhen it is authored by hand\nThen it should render highlighted`;
  await page.fill('[data-testid="case-gherkin-input"]', gherkinBody);
  await page.click('[data-testid="case-form-submit"]');
  // "**/cases/**" would also match the starting /cases/new URL — require a
  // path segment after /cases/ that isn't "new".
  await page.waitForURL(/\/cases\/(?!new)[^/?#]+$/);
  const newCaseUrl = page.url();
  await expect(page.locator('[data-testid="gherkin-block"]')).toContainText(
    `a manual scenario ${ts}`
  );

  // 4. Edit it — the form must reopen already in Gherkin mode with the body intact.
  await page.goto(`${newCaseUrl}/edit`);
  await expect(page.locator('[data-testid="case-format-gherkin"]')).toHaveClass(/bg-indigo-600/);
  await expect(page.locator('[data-testid="case-gherkin-input"]')).toHaveValue(gherkinBody);

  // 5. Export .feature — both scenario titles show up in the downloaded text.
  const exportRes = await page.request.get(
    `/api/export/gherkin?project=${E2E.projectSlug}`
  );
  expect(exportRes.status()).toBe(200);
  const exported = await exportRes.text();
  expect(exported).toContain("Valid credentials log the user in");
  expect(exported).toContain(`Manual Gherkin case ${ts}`);
});
