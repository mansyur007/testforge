import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-22 Importers: TestRail XML, Qase JSON, TestLink XML — each preview-then-commit
// through its own tab, creating suites by path and cases underneath.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

function fixture(name: string) {
  return fs.readFileSync(path.join(__dirname, "fixtures/import", name), "utf8");
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function uploadFixture(page: Page, tool: string, filename: string) {
  await page.goto(`/projects/${E2E.projectSlug}/import?tab=${tool}`);
  const buffer = fixture(filename);
  await page.setInputFiles(`[data-testid="import-file-${tool}"]`, {
    name: filename,
    mimeType: filename.endsWith(".json") ? "application/json" : "application/xml",
    buffer: Buffer.from(buffer),
  });
}

test(`TC-${TC}-31 TestRail import: nested sections, priority/type mapping, warnings`, async ({
  page,
}) => {
  await login(page);
  await uploadFixture(page, "testrail", "testrail.xml");
  await page.click('[data-testid="import-preview-testrail"]');

  const result = page.locator('[data-testid="import-preview-result-testrail"]');
  await expect(result).toContainText("3");
  await expect(result).toContainText("unknown priority");
  await expect(result).toContainText("unknown type");

  await page.click('[data-testid="import-commit-testrail"]');
  await expect(page.locator('[data-testid="import-message-testrail"]')).toContainText(
    "3 test cases imported"
  );
  await expect(page.locator('[data-testid="import-message-testrail"]')).toContainText(
    "4 suites created"
  );

  const res = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?q=Valid login redirects to dashboard`
  );
  const body = await res.json();
  expect(body.data.some((c: { title: string }) => c.title === "Valid login redirects to dashboard")).toBe(
    true
  );
});

test(`TC-${TC}-32 Qase import: JSON suites/cases, severity fallback priority`, async ({
  page,
}) => {
  await login(page);
  await uploadFixture(page, "qase", "qase.json");
  await page.click('[data-testid="import-preview-qase"]');

  const result = page.locator('[data-testid="import-preview-result-qase"]');
  await expect(result).toContainText("3");

  await page.click('[data-testid="import-commit-qase"]');
  await expect(page.locator('[data-testid="import-message-qase"]')).toContainText(
    "3 test cases imported"
  );

  const res = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?q=Locked out after 5 failed attempts`
  );
  const body = await res.json();
  expect(body.data.length).toBeGreaterThan(0);
});

test(`TC-${TC}-33 TestLink import: nested testsuite tree, importance mapping`, async ({
  page,
}) => {
  await login(page);
  await uploadFixture(page, "testlink", "testlink.xml");
  await page.click('[data-testid="import-preview-testlink"]');

  const result = page.locator('[data-testid="import-preview-result-testlink"]');
  await expect(result).toContainText("2");
  await expect(result).toContainText("unknown importance");

  await page.click('[data-testid="import-commit-testlink"]');
  await expect(page.locator('[data-testid="import-message-testlink"]')).toContainText(
    "2 test cases imported"
  );

  const res = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?q=Valid login with correct credentials`
  );
  const body = await res.json();
  expect(body.data.length).toBeGreaterThan(0);
});
