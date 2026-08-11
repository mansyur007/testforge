import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// A-01: TestForge QA Academy shell. A-03: its entry points and sitemap.
// Every Academy route is public, so all of this runs unauthenticated except
// TC-E2E-93. That is itself part of what's under test: the point of the hybrid
// placement (docs/QA-ACADEMY.md §1) is that a stranger from a search result can
// read an entire track without an account.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// Only TC-E2E-93 needs a session — it checks the in-app entry point.
async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

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

test(`TC-${TC}-92 Academy is reachable from the landing page and listed in the sitemap`, async ({
  page,
}) => {
  // A-01 shipped the routes with no inbound link anywhere; A-03 is what makes
  // them discoverable, so "the link exists and goes somewhere" is the feature.
  await page.goto("/");
  await page.locator("header").getByRole("link", { name: "Academy" }).click();
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();

  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/academy");
  expect(sitemap).toContain("/academy/fundamentals");
  expect(sitemap).toContain("/academy/fundamentals/boundary-value-analysis");
  // Drafts have no route, so they must not be advertised to crawlers.
  expect(sitemap).not.toContain("/academy/istqb");

  // The track page carries Course markup with the real lesson workload.
  await page.goto("/academy/fundamentals");
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const graph = JSON.parse(ld ?? "{}")["@graph"] as Array<Record<string, unknown>>;
  const course = graph.find((n) => n["@type"] === "Course");
  expect(course).toBeTruthy();
  expect(course?.isAccessibleForFree).toBe(true);
  expect(
    (course?.hasCourseInstance as Record<string, string> | undefined)?.courseWorkload,
  ).toMatch(/^PT\d+H(\d+M)?$/);
});

test(`TC-${TC}-93 Academy is reachable from the app sidebar`, async ({ page }) => {
  await login(page);
  await page.click('[data-testid="nav-academy"]');
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();
});

test(`TC-${TC}-94 On a phone Academy is reachable without the desktop nav`, async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // The landing header nav is `hidden md:flex` and the landing has no
  // hamburger, so on a phone it carries nothing. That is exactly why the hero
  // link and the Academy section exist — this test is the guard that removing
  // either one would leave mobile visitors with only the footer.
  await expect(page.locator("header nav")).toBeHidden();

  const section = page.locator("#academy");
  await expect(section).toBeVisible();
  // Five tracks, read from the content module rather than retyped here.
  await expect(section.getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(section.getByTestId("landing-academy-cta")).toBeVisible();

  await page.click('[data-testid="hero-academy-link"]');
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();
});

test(`TC-${TC}-95 Every Academy entry point is labelled beta`, async ({ page }) => {
  await page.goto("/");
  // Hero link, header nav, footer and the section CTA all carry the chip; the
  // count is the assertion because a missing one is the failure mode.
  await expect(page.getByTestId("beta-chip")).toHaveCount(4);

  await page.goto("/academy");
  await expect(page.getByTestId("academy-beta-banner")).toBeVisible();
  await expect(page.getByTestId("academy-beta-banner")).toContainText("in beta");

  await login(page);
  await expect(
    page.locator('[data-testid="nav-academy"] [data-testid="beta-chip"]'),
  ).toBeVisible();
});

const LESSON = "/academy/fundamentals/what-qa-does";

test(`TC-${TC}-96 Self-check grades, explains, retries, and records progress`, async ({
  page,
}) => {
  await page.goto(LESSON);
  await expect(page.getByTestId("self-check")).toBeVisible();

  // Nothing is revealed before submitting — the explanation only exists in the
  // grading response.
  await expect(page.getByTestId("self-check-explanation-q1")).toHaveCount(0);
  await expect(page.getByTestId("self-check-submit")).toBeDisabled();

  // Answer everything wrong first: a quiz that only works when you're right is
  // not a quiz, and the explanation has to show up either way.
  await page.click('[data-testid="self-check-choice-q1-a"]');
  await page.click('[data-testid="self-check-choice-q2-a"]');
  await page.click('[data-testid="self-check-choice-q3-c"]');
  await page.click('[data-testid="self-check-submit"]');

  await expect(page.getByTestId("self-check-score")).toContainText("0 / 3");
  await expect(page.getByTestId("self-check-explanation-q1")).toBeVisible();
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.click('[data-testid="self-check-retry"]');
  await expect(page.getByTestId("self-check-explanation-q1")).toHaveCount(0);

  await page.click('[data-testid="self-check-choice-q1-b"]');
  await page.click('[data-testid="self-check-choice-q2-b"]');
  // q3 is multi-select: all three of a, b, d, and set equality is the rule.
  await page.click('[data-testid="self-check-choice-q3-a"]');
  await page.click('[data-testid="self-check-choice-q3-b"]');
  await page.click('[data-testid="self-check-choice-q3-d"]');
  await page.click('[data-testid="self-check-submit"]');

  await expect(page.getByTestId("self-check-score")).toContainText("3 / 3");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Progress is localStorage, so it has to survive a reload and be visible on
  // the track page — that is the whole user-facing point of storing it.
  await page.reload();
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/academy/fundamentals");
  await expect(page.getByTestId("track-progress")).toContainText(
    "1 of 13 lessons done",
  );
});

test(`TC-${TC}-97 The answer key never reaches the browser`, async ({ page }) => {
  // The served document carries the RSC payload inline, so this covers both the
  // HTML and the flight data the client hydrates from. `scripts/academy-bundle-
  // check.mjs` covers the JS chunks at build time; between them there is nowhere
  // for an answer to hide.
  const html = await (await page.request.get(LESSON)).text();

  // A sentence that exists only in an explanation.
  expect(html).not.toContain("No amount of testing proves the absence of defects");
  expect(html).not.toContain("correctChoiceIds");
  expect(html).not.toContain('"correct":true');

  // The questions themselves are of course present — this is a check on what
  // was stripped, not a check that the quiz failed to render.
  expect(html).toContain("What is the honest answer?");
});

test(`TC-${TC}-98 The sandbox is created on demand, seeded, and kept out of the user's work`, async ({
  page,
}) => {
  await login(page);

  // Baseline: how many projects the dashboard counts before a sandbox exists.
  await page.goto("/dashboard");
  const projectsBefore = await page
    .getByTestId("stat-active-projects")
    .textContent()
    .catch(() => null);

  await page.goto("/academy/sandbox");
  const existing = await page.getByTestId("sandbox-open").count();
  if (existing === 0) {
    await page.click('[data-testid="sandbox-create"]');
    // Creation redirects into the project itself.
    await page.waitForURL(/\/projects\/academy-/);
  }

  // Seeded with the ShopMini fixture: four suites and three reference cases.
  await page.goto("/academy/sandbox");
  await expect(page.getByTestId("sandbox-open")).toBeVisible();
  const slug = (await page.getByTestId("sandbox-open").getAttribute("href"))!
    .split("/")
    .pop()!;
  expect(slug).toMatch(/^academy-/);

  await page.goto(`/projects/${slug}`);
  await expect(page.getByText("Cart", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Cart — quantity above maximum (100) is rejected"),
  ).toBeVisible();

  // The point of Project.kind: a real project that stays out of the surfaces
  // listing the user's actual work.
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: /academy-/ })).toHaveCount(0);

  await page.goto("/dashboard");
  const projectsAfter = await page
    .getByTestId("stat-active-projects")
    .textContent()
    .catch(() => null);
  expect(projectsAfter).toBe(projectsBefore);
});

test(`TC-${TC}-99 Reset wipes the sandbox back to the fixture without duplicating it`, async ({
  page,
}) => {
  await login(page);
  await page.goto("/academy/sandbox");
  if ((await page.getByTestId("sandbox-open").count()) === 0) {
    await page.click('[data-testid="sandbox-create"]');
    await page.waitForURL(/\/projects\/academy-/);
    await page.goto("/academy/sandbox");
  }
  const slug = (await page.getByTestId("sandbox-open").getAttribute("href"))!
    .split("/")
    .pop()!;

  // Two-step: the first click only arms it, so a stray click cannot wipe work.
  await page.click('[data-testid="sandbox-reset"]');
  await expect(page.getByTestId("sandbox-reset-confirm")).toBeVisible();
  await page.click('[data-testid="sandbox-reset-confirm"]');
  await expect(page.getByTestId("sandbox-reset-done")).toBeVisible();

  // The failure mode worth guarding: re-seeding on top of the old rows instead
  // of replacing them. The fixture case must appear exactly once.
  await page.goto(`/projects/${slug}`);
  await expect(
    page.getByText("Cart — quantity above maximum (100) is rejected"),
  ).toHaveCount(1);
});
