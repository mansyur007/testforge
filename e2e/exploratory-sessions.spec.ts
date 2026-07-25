import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-25 Exploratory / session-based testing: start a timeboxed session, drop
// notes of every kind via the quick-add hotkeys, convert an IDEA note into a
// draft case, end the session, and confirm the BUG note's "file as issue"
// affordance stays hidden since the e2e project has no tracker configured
// (graceful degrade, not a silent failure).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// The quick-add hotkeys are a window-level keydown handler that deliberately
// stands down while the target is an input/textarea. To exercise them the test
// has to hand focus back to the document — the composer re-focuses its textarea
// after every added note. This used to be `page.locator("body").click()`, which
// clicks the *centre of the page*: once the project header lost a row the
// centre drifted into the note textarea, so the click focused the very field
// that suppresses the hotkey and the suite went red. Blur explicitly instead —
// it says what it means and doesn't move with the layout.
async function blurActiveElement(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-64 Exploratory sessions: hotkey notes, IDEA→draft case, end session`, async ({
  page,
}) => {
  const ts = Date.now();
  const charter = `Explore search filters ${ts}`;
  await login(page);

  // 1. Start a session.
  await page.goto(`/projects/${E2E.projectSlug}/sessions`);
  await page.fill('[data-testid="session-charter-input"]', charter);
  await page.fill('[data-testid="session-timebox-input"]', "15");
  await page.click('[data-testid="session-start-button"]');
  await page.waitForURL("**/sessions/**");
  const sessionUrl = page.url();
  await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();

  // 2. Hotkey "b" selects BUG, then submit a note.
  await blurActiveElement(page);
  await page.keyboard.press("b");
  await expect(page.locator('[data-testid="session-kind-BUG"]')).toHaveClass(/bg-red-100/);
  await page.fill(
    '[data-testid="session-note-input"]',
    `Filter dropdown overlaps results on narrow viewports ${ts}`
  );
  await page.click('[data-testid="session-note-submit"]');
  await expect(page.locator('[data-testid="session-notes-list"]')).toContainText(
    `Filter dropdown overlaps results on narrow viewports ${ts}`
  );

  // 3. Hotkey "i" selects IDEA, then submit a note.
  await blurActiveElement(page);
  await page.keyboard.press("i");
  await expect(page.locator('[data-testid="session-kind-IDEA"]')).toHaveClass(/bg-indigo-100/);
  const ideaText = `Add a case for filtering by multiple tags at once ${ts}`;
  await page.fill('[data-testid="session-note-input"]', ideaText);
  await page.click('[data-testid="session-note-submit"]');
  await expect(page.locator('[data-testid="session-notes-list"]')).toContainText(ideaText);

  // 4. Convert the IDEA note to a draft case.
  const ideaNote = page.locator('[data-testid="session-notes-list"] li', { hasText: ideaText });
  await ideaNote.locator('[data-testid="session-note-convert-case"]').click();
  await expect(ideaNote.getByText("Converted to draft case")).toBeVisible();
  const caseLink = ideaNote.locator("a", { hasText: /^TC-/ });
  const caseHref = await caseLink.getAttribute("href");
  expect(caseHref).toBeTruthy();

  // The new case is a real DRAFT case, reachable from the link.
  await caseLink.click();
  await page.waitForURL("**/cases/**");
  await expect(page.getByText("DRAFT")).toBeVisible();

  // 5. Back on the session, the BUG note has no "file as issue" button — no
  // tracker is configured for this project (graceful degrade, not silent).
  await page.goto(sessionUrl);
  await expect(
    page.locator('[data-testid="session-note-convert-issue"]')
  ).toHaveCount(0);

  // 6. End the session.
  await page.click('[data-testid="session-end-button"]');
  await expect(page.getByText("ENDED")).toBeVisible();
  await expect(page.locator('[data-testid="session-end-button"]')).toHaveCount(0);
});
