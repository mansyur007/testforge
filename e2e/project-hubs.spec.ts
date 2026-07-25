import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// The project tab bar ends in two hub controls — Tracking and Settings. Both
// open a modal that is a real route: deep-linkable, reloadable, closable with
// Escape or the ✕, and rendering its sections server-side. Every section also
// keeps a standalone permalink with the tab bar around it, so a direct link
// still lands somewhere navigable.

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test.describe("Project hubs", () => {
  test("Tracking opens a section modal, switches sections, and closes", async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/projects/${E2E.projectSlug}`);

    // The trigger is a tab, styled exactly like Settings next to it.
    const trigger = page.getByTestId("project-tracking-trigger");
    await expect(trigger).toHaveClass(/border-b-2/);
    await trigger.click();

    // Lands on the first section in the nav, and the modal says so.
    await page.waitForURL("**/tracking/requirements");
    const modal = page.getByTestId("project-tracking-modal");
    await expect(modal).toBeVisible();
    await expect(
      page.getByTestId("project-tracking-item-requirements")
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("project-tracking-content")).toContainText(
      "Requirements"
    );

    // Switching section navigates without leaving the modal.
    await page.getByTestId("project-tracking-item-defects").click();
    await page.waitForURL("**/tracking/defects");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("project-tracking-content")).toContainText(
      "Defects"
    );

    // Deep-linkable: a reload keeps the modal on the same section.
    await page.reload();
    await expect(page.getByTestId("project-tracking-modal")).toBeVisible();
    await expect(
      page.getByTestId("project-tracking-item-defects")
    ).toHaveAttribute("aria-current", "page");

    // Escape closes it back to the project.
    await page.keyboard.press("Escape");
    await page.waitForURL(`**/projects/${E2E.projectSlug}`);
    await expect(page.getByTestId("project-tracking-modal")).toHaveCount(0);
  });

  test("each tracking section keeps a standalone permalink with the tab bar", async ({
    page,
  }) => {
    await login(page);

    for (const [path, heading] of [
      ["requirements", "Requirements"],
      ["sessions", "Exploratory Sessions"],
      ["defects", "Defects"],
      ["baselines", "Suite Baselines"],
    ] as const) {
      await page.goto(`/projects/${E2E.projectSlug}/${path}`);
      // Tab bar present (so it is the standalone page, not the modal)…
      await expect(page.getByTestId("project-tracking-trigger")).toBeVisible();
      await expect(page.getByTestId("project-tracking-modal")).toHaveCount(0);
      // …and the section itself rendered.
      await expect(
        page.getByRole("heading", { name: heading, exact: true })
      ).toBeVisible();
    }
  });

  test("Settings hub still behaves the same way", async ({ page }) => {
    await login(page);
    await page.goto(`/projects/${E2E.projectSlug}`);

    await page.getByTestId("project-settings-trigger").click();
    await page.waitForURL("**/settings/import");
    await expect(page.getByTestId("project-settings-modal")).toBeVisible();

    await page.getByTestId("project-settings-item-members").click();
    await page.waitForURL("**/settings/members");
    await expect(page.getByTestId("project-settings-modal")).toBeVisible();

    await page.getByTestId("project-settings-modal-close").click();
    await page.waitForURL(`**/projects/${E2E.projectSlug}`);
    await expect(page.getByTestId("project-settings-modal")).toHaveCount(0);
  });
});
