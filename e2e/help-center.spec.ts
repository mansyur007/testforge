import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-37: in-app help center — nav link, index listing, and a topic page
// rendering markdown content.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-27 Help nav link opens the index, a topic renders markdown`, async ({
  page,
}) => {
  await login(page);
  await page.click('[data-testid="nav-help"]');
  await page.waitForURL("**/docs/help");
  await expect(page.getByRole("heading", { name: "Help", exact: true })).toBeVisible();

  await page.click('[data-testid="help-topic-automation"]');
  await page.waitForURL("**/docs/help/automation");
  await expect(
    page.getByRole("heading", { name: "Automation & CI upload" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Legacy endpoint" })).toBeVisible();
  // L-02 added a second code block (the quality-gate CI step) to this topic.
  await expect(page.locator("pre code").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "CI quality gates" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to app" }).click();
  await page.waitForURL("**/dashboard");
});
