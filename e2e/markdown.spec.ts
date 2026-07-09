import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-02 Markdown: GFM renders on the case detail page and script injection is
// sanitized to inert text (no dialog can fire).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-6 Markdown renders sanitized on case detail`, async ({ page }) => {
  let dialogFired = false;
  page.on("dialog", (d) => {
    dialogFired = true;
    d.dismiss().catch(() => {});
  });

  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}/cases/new`);

  const title = `Markdown demo ${Date.now()}`;
  await page.fill('[data-testid="case-title-input"]', title);
  await page.fill(
    '[data-testid="case-description-editor"]',
    "**bold move** and `code`\n\n<script>alert(1)</script>\n\n- item one"
  );
  // A step is required for a meaningful case; plain text stays plain (AC 4).
  await page
    .locator('textarea[placeholder^="Action step"]')
    .first()
    .fill("Open the /login page");
  await page.click('[data-testid="case-form-submit"]');
  await page.waitForURL("**/cases/**");

  // GFM rendered…
  const desc = page.locator(".tf-markdown").first();
  await expect(desc.locator("strong", { hasText: "bold move" })).toBeVisible();
  await expect(desc.locator("code", { hasText: "code" })).toBeVisible();
  await expect(desc.locator("li", { hasText: "item one" })).toBeVisible();
  // …and the script never executed nor rendered as an element.
  expect(await page.locator("script", { hasText: "alert(1)" }).count()).toBe(0);
  expect(dialogFired).toBe(false);

  // Editor preview tab round-trip on the edit page.
  await page.goto(page.url() + "/edit");
  await page.getByRole("button", { name: "preview" }).first().click();
  await expect(
    page.locator(".tf-markdown strong", { hasText: "bold move" })
  ).toBeVisible();
});
