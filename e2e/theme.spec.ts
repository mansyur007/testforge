import { test, expect } from "@playwright/test";
import { E2E } from "./global-setup";

// F-39: light/dark theme. Cookie-only preference (tf_theme), applied by an
// inline <head> script before first paint — see src/lib/theme.ts.

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test("TC-THEME-1 default (no cookie) resolves to system preference", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme-pref", "system");
});

test("TC-THEME-2 explicit dark cookie applies the class on first paint", async ({ context, page }) => {
  await context.addCookies([
    { name: "tf_theme", value: "dark", url: "http://localhost:3456" },
  ]);
  await page.goto("/login");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("TC-THEME-3 sidebar switcher toggles dark without a reload and writes the cookie", async ({ page }) => {
  await login(page);
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.click('[data-testid="theme-dark"]');
  await expect(html).toHaveClass(/dark/);

  const cookies = await page.context().cookies();
  const themeCookie = cookies.find((c) => c.name === "tf_theme");
  expect(themeCookie?.value).toBe("dark");

  // Restore to avoid leaking state into later tests in this worker.
  await page.click('[data-testid="theme-light"]');
});

test("TC-THEME-4 choice survives a reload and a client-side navigation", async ({ page }) => {
  await login(page);
  await page.click('[data-testid="theme-dark"]');
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByTestId("nav-projects").click();
  await expect(page).toHaveURL(/\/projects/);
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.click('[data-testid="theme-light"]');
});

test("TC-THEME-5 system preference follows the OS colour scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/login");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("TC-THEME-6 an explicit light cookie beats a dark OS preference", async ({ context, page }) => {
  await context.addCookies([
    { name: "tf_theme", value: "light", url: "http://localhost:3456" },
  ]);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("TC-THEME-7 print documents stay light regardless of the theme cookie", async ({ context, page }) => {
  await context.addCookies([
    { name: "tf_theme", value: "dark", url: "http://localhost:3456" },
  ]);
  await login(page);
  await page.goto(`/print/projects/${E2E.projectSlug}/cases`);
  const doc = page.locator(".tf-print-doc").first();
  await expect(doc).toBeVisible();
  const bg = await doc.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(255, 255, 255)");
});

test("TC-THEME-8 the landing page (logged out) exposes a working theme switcher", async ({ page }) => {
  await page.goto("/");
  const group = page.getByTestId("theme-switcher");
  await expect(group).toBeVisible();
  await page.getByTestId("theme-dark").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("TC-THEME-9 no-flash: the dark canvas colour is already applied before the page finishes loading", async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: "tf_theme", value: "dark", url: "http://localhost:3456" },
  ]);
  await page.goto("/login");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Dark --tf-canvas is 2 6 23.
  expect(bg).toBe("rgb(2, 6, 23)");
});
