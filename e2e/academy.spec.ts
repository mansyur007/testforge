import { test, expect } from "@playwright/test";

// A-01: TestForge QA Academy shell. Every route here is public, so the whole
// spec runs in the default unauthenticated context — no login helper. That is
// itself part of what's under test: the point of the hybrid placement
// (docs/QA-ACADEMY.md §1) is that a stranger from a search result can read the
// entire track without an account.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

test(`TC-${TC}-88 Academy roadmap lists published tracks and marks the rest in progress`, async ({
  page,
}) => {
  await page.goto("/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();

  // The published track is a link; a track still being written is not — a card
  // people can click into an empty shell is worse than one that says so.
  const live = page.getByTestId("academy-track-fundamentals");
  await expect(live).toHaveAttribute("href", "/academy/fundamentals");

  const draft = page.getByTestId("academy-track-istqb");
  await expect(draft).toBeVisible();
  await expect(draft).not.toHaveAttribute("href", /./);
  await expect(draft).toContainText("In progress");

  // §7: the disclaimer travels with any surface that names the scheme.
  await expect(page.getByText(/registered trademark of the International/)).toBeVisible();
});

test(`TC-${TC}-89 A track page opens its first lesson and prev/next walk the track`, async ({
  page,
}) => {
  await page.goto("/academy/fundamentals");
  await expect(
    page.getByRole("heading", { name: "QA Fundamentals", level: 1 }),
  ).toBeVisible();

  await page.click('[data-testid="academy-track-start"]');
  await page.waitForURL("**/academy/fundamentals/what-qa-does");
  await expect(
    page.getByRole("heading", { name: "What a tester actually does", level: 1 }),
  ).toBeVisible();
  // Markdown really rendered, rather than the body leaking as raw text.
  await expect(
    page.getByRole("heading", { name: "The job in one sentence" }),
  ).toBeVisible();

  // Forward, then straight back: the first lesson must have no "Previous".
  await page.click('[data-testid="academy-next"]');
  await page.waitForURL("**/academy/fundamentals/sdlc-and-stlc");
  await page.click('[data-testid="academy-prev"]');
  await page.waitForURL("**/academy/fundamentals/what-qa-does");
  await expect(page.getByTestId("academy-prev")).toHaveCount(0);
});

test(`TC-${TC}-90 Hands-on lessons carry the exercise callout; unwritten routes 404`, async ({
  page,
}) => {
  await page.goto("/academy/fundamentals/boundary-value-analysis");
  await expect(page.getByTestId("academy-sandbox-callout")).toBeVisible();

  // A lesson without an exercise must not show it — the badge is a promise.
  await page.goto("/academy/fundamentals/seven-principles");
  await expect(page.getByTestId("academy-sandbox-callout")).toHaveCount(0);

  // `dynamicParams = false` is what keeps drafts out of production: a track
  // that exists in the content module but isn't published has no route at all.
  const draftTrack = await page.goto("/academy/istqb");
  expect(draftTrack?.status()).toBe(404);
  const draftLesson = await page.goto("/academy/fundamentals/not-a-lesson");
  expect(draftLesson?.status()).toBe(404);
});

test(`TC-${TC}-91 Academy routes don't overflow a 375px phone`, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  // Lesson bodies are author-written markdown, and the widest thing in T1 is the
  // decision table's nine columns — the one place a lesson can push the page
  // sideways. F-43's rule applies to public routes too: wide content scrolls
  // inside its own box, the document never does.
  for (const path of [
    "/academy",
    "/academy/fundamentals",
    "/academy/fundamentals/decision-tables",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
