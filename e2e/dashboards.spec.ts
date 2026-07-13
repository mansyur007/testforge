import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-17 Dashboard builder: create a dashboard, add a report widget and a text
// note, reposition one with the arrow buttons (x+1 shifts its grid column),
// remove a widget, and delete the dashboard.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-41 Dashboards: create, add/move/remove widgets, delete`, async ({
  page,
}) => {
  const ts = Date.now();
  const name = `Release Health ${ts}`;
  await login(page);

  // 1. Create a dashboard from the Dashboards tab.
  await page.goto(`/projects/${E2E.projectSlug}/dashboards`);
  await page.fill('[data-testid="dashboard-name-input"]', name);
  await page.click('button:has-text("+ Dashboard")');
  await page.waitForURL("**/dashboards/**");
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // 2. Add a Pass Rate Trend widget and a Text Note.
  await page.selectOption('[data-testid="widget-type-select"]', "passRateTrend");
  await page.click('[data-testid="widget-add-button"]');
  await expect(page.getByRole("heading", { name: "Pass Rate Trend" })).toBeVisible();

  await page.selectOption('[data-testid="widget-type-select"]', "textNote");
  await page.fill('[data-testid="widget-title-input"]', "Team notes");
  await page.fill('[data-testid="widget-text-input"]', "**Focus**: release regression sweep");
  await page.click('[data-testid="widget-add-button"]');
  await expect(page.getByRole("heading", { name: "Team notes" })).toBeVisible();
  await expect(page.getByText("release regression sweep")).toBeVisible();

  // 3. Arrow repositioning: moving the first widget right shifts its column.
  const card = page.locator('[data-testid^="widget-card-"]').first();
  const widgetId = (await card.getAttribute("data-testid"))!.replace(
    "widget-card-",
    ""
  );
  await expect(card).toHaveCSS("grid-column-start", "1");
  await page.click(`[data-testid="widget-right-${widgetId}"]`);
  await expect(
    page.locator(`[data-testid="widget-card-${widgetId}"]`)
  ).toHaveCSS("grid-column-start", "2");

  // 4. Remove the text note.
  const noteCard = page.locator('[data-testid^="widget-card-"]', {
    hasText: "Team notes",
  });
  const noteId = (await noteCard.getAttribute("data-testid"))!.replace(
    "widget-card-",
    ""
  );
  await page.click(`[data-testid="widget-remove-${noteId}"]`);
  await expect(page.getByRole("heading", { name: "Team notes" })).toHaveCount(0);

  // 5. Dashboards list shows the card; delete the dashboard.
  await page.goto(`/projects/${E2E.projectSlug}/dashboards`);
  await expect(page.locator(`[data-testid="dashboard-card-${name}"]`)).toBeVisible();
  await page.click(`[data-testid="dashboard-card-${name}"]`);
  await page.waitForURL("**/dashboards/**");
  await page.click('button:has-text("Delete dashboard")');
  await page.waitForURL("**/dashboards");
  await expect(page.locator(`[data-testid="dashboard-card-${name}"]`)).toHaveCount(0);
});
