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

/* F-46: colour palettes — the second theme axis. The preference is two more
   cookies (tf_palette, tf_accent) read by the same <head> boot script, so the
   assertions below are on the token values the app actually resolves rather
   than on class names. */

const OCEAN_LIGHT_ACCENT = "3 105 161";
const OCEAN_DARK_CANVAS = "3 16 26";

function token(page: import("@playwright/test").Page, name: string) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  );
}

/** The mode switcher inside the page, not the one in the sidebar footer:
 *  /settings/appearance is the one route that renders both, so a bare
 *  getByTestId("theme-dark") is a strict-mode violation there. */
function mode(page: import("@playwright/test").Page, id: "light" | "system" | "dark") {
  return page.getByRole("main").getByTestId(`theme-${id}`);
}

test("TC-THEME-10 a palette cookie is applied before first paint, logged out", async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: "tf_palette", value: "emerald", url: "http://localhost:3456" },
  ]);
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "emerald");
  expect(await token(page, "--tf-accent")).toBe("4 120 87");
});

test("TC-THEME-11 the Appearance page switches palette live and remembers it", async ({ page }) => {
  await login(page);
  await page.goto("/settings/appearance");
  await page.getByTestId("palette-ocean").click();

  expect(await token(page, "--tf-accent")).toBe(OCEAN_LIGHT_ACCENT);
  const cookie = (await page.context().cookies()).find((c) => c.name === "tf_palette");
  expect(cookie?.value).toBe("ocean");

  // Survives a reload and a client-side navigation, like the mode does.
  await page.reload();
  expect(await token(page, "--tf-accent")).toBe(OCEAN_LIGHT_ACCENT);
  await page.getByTestId("nav-projects").click();
  await expect(page).toHaveURL(/\/projects/);
  expect(await token(page, "--tf-accent")).toBe(OCEAN_LIGHT_ACCENT);

  await page.goto("/settings/appearance");
  await page.getByTestId("palette-reset").click();
});

test("TC-THEME-12 each palette has its own dark variant, and light never leaks into it", async ({
  page,
}) => {
  await login(page);
  await page.goto("/settings/appearance");
  await page.getByTestId("palette-ocean").click();
  await mode(page, "dark").click();

  // The `:not(.dark)` guard in globals.css: without it the light block would
  // win over `.dark` on source order alone, both sitting on <html>.
  expect(await token(page, "--tf-canvas")).toBe(OCEAN_DARK_CANVAS);
  expect(await token(page, "--tf-accent")).not.toBe(OCEAN_LIGHT_ACCENT);

  await mode(page, "light").click();
  expect(await token(page, "--tf-accent")).toBe(OCEAN_LIGHT_ACCENT);
  await page.getByTestId("palette-reset").click();
});

test("TC-THEME-13 a custom accent is derived for both modes and keeps white text legible", async ({
  page,
}) => {
  await login(page);
  await page.goto("/settings/appearance");

  // A pale yellow: applied literally it would leave every `bg-accent
  // text-white` button unreadable, so the derivation has to darken it.
  await page.getByTestId("accent-hex").fill("#ffe066");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "custom");

  const contrast = async () => {
    const value = await token(page, "--tf-accent");
    return page.evaluate((v: string) => {
      const lum = v.split(" ").reduce((acc, ch, i) => {
        const n = Number(ch) / 255;
        const c = n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
        return acc + [0.2126, 0.7152, 0.0722][i] * c;
      }, 0);
      return 1.05 / (lum + 0.05);
    }, value);
  };

  expect(await contrast()).toBeGreaterThanOrEqual(4.5); // light mode threshold
  await mode(page, "dark").click();
  expect(await contrast()).toBeGreaterThanOrEqual(3.5); // dark mode threshold

  // The ramp is written inline on <html> — that is what outranks every block.
  const inline = await page.getAttribute("html", "style");
  expect(inline).toContain("--tf-accent-soft");

  await mode(page, "light").click();
  await page.getByTestId("palette-reset").click();
  expect(await page.getAttribute("html", "style")).toBe("");
});

test("TC-THEME-14 a custom accent survives a reload, derived before first paint", async ({
  page,
}) => {
  await login(page);
  await page.goto("/settings/appearance");
  await page.getByTestId("accent-hex").fill("#e11d48");
  const applied = await token(page, "--tf-accent");

  await page.reload();
  expect(await page.getAttribute("html", "data-palette")).toBe("custom");
  expect(await token(page, "--tf-accent")).toBe(applied);
  await expect(page.getByTestId("palette-custom")).toHaveAttribute("aria-checked", "true");

  await page.getByTestId("palette-reset").click();
});
