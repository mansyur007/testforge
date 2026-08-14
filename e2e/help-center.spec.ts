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

  // A-09b: a topic page opened with a session now keeps the app shell, so the
  // way back to the app is the sidebar, not the standalone header's
  // "Back to app" link that used to stand in for it.
  await expect(page.getByTestId("app-sidebar")).toBeVisible();
  await page.getByTestId("nav-dashboard").click();
  await page.waitForURL("**/dashboard");
});

// A-09: /docs/help gets the same treatment as /academy — public route, two
// shells depending on session. See docs/QA-ACADEMY.md A-09.
test(`TC-${TC}-111 A signed-in visitor gets the app shell on /docs/help`, async ({ page }) => {
  await login(page);
  await page.goto("/docs/help");
  await expect(page.getByRole("heading", { name: "Help", exact: true })).toBeVisible();
  await expect(page.getByTestId("app-sidebar")).toBeVisible();
  await expect(page.getByTestId("nav-help")).toBeVisible();
});

test(`TC-${TC}-112 A guest on /docs/help sees Log in and Sign up, and no app shell`, async ({
  page,
}) => {
  await page.goto("/docs/help");
  await expect(page.getByTestId("app-sidebar")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up", exact: true })).toHaveAttribute(
    "href",
    "/signup",
  );
});

// A-09b: the same split, one level in — topic pages were left on standalone
// chrome by A-09. See docs/QA-ACADEMY.md A-09b.
test(`TC-${TC}-126 A guest on a help topic gets the public chrome, and the topic still renders`, async ({
  page,
}) => {
  await page.goto("/docs/help/automation");
  await expect(page.getByTestId("app-sidebar")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Automation & CI upload" })
  ).toBeVisible();
});
