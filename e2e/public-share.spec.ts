import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-38 Public project sharing ("portfolio mode"): the owner publishes the
// project from Settings → Public sharing, then a fully UNAUTHENTICATED context
// browses /public/<slug> and its test cases. Every toggle is checked from that
// anonymous context — the point of the feature is what a stranger can and
// cannot reach.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

/** The public pages are ISR-cached; the server actions purge that cache, but a
 * navigation racing the purge can still see the old render. Retry briefly. */
async function expectStatus(
  ctx: BrowserContext,
  path: string,
  status: number
): Promise<void> {
  let last = 0;
  for (let i = 0; i < 10; i++) {
    const res = await ctx.request.get(path, { maxRedirects: 0 });
    last = res.status();
    if (last === status) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  expect(last, `${path} should answer ${status}`).toBe(status);
}

test(`TC-${TC}-80 Public sharing: anonymous portfolio view, section + index toggles, 404 when off`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. A case with real content so the public detail page has steps to render.
  const caseTitle = `Public portfolio case ${ts}`;
  const createRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    {
      data: {
        title: caseTitle,
        priority: "HIGH",
        type: "SMOKE",
        preconditions: "User account exists",
        steps: [{ action: "Open the login page", expected: "Form is visible" }],
        expectedResult: "Dashboard loads",
        tags: "portfolio",
      },
    }
  );
  expect(createRes.status()).toBe(201);
  const created = (await createRes.json()) as {
    id: string;
    displayId: string;
  };

  // 2. Publish the project.
  await page.goto(`/projects/${E2E.projectSlug}/sharing`);
  await page.click('[data-testid="public-share-enable"]');
  await expect(page.locator('[data-testid="public-share-disable"]')).toBeVisible();
  await expect(page.locator('[data-testid="public-share-url"]')).toContainText(
    `/public/${E2E.projectSlug}`
  );

  const anon = await browser.newContext();
  const anonPage = await anon.newPage();

  // 3. Overview renders with NO session at all.
  await anonPage.goto(`/public/${E2E.projectSlug}`);
  await expect(
    anonPage.locator('[data-testid="public-overview-title"]')
  ).toHaveText("E2E");
  await expect(
    anonPage.locator('[data-testid="public-readonly-chip"]')
  ).toBeVisible();
  const caseCount = Number(
    await anonPage.locator('[data-testid="public-stat-cases"] p').last().textContent()
  );
  expect(caseCount).toBeGreaterThan(0);

  // Read-only discipline: no mutation surface, no links back into the app
  // other than the "Built with TestForge" CTA to /login.
  expect(await anonPage.locator("form").count()).toBe(0);
  expect(await anonPage.locator('a[href^="/projects"]').count()).toBe(0);
  await expect(anonPage.locator('[data-testid="public-cta-link"]')).toHaveAttribute(
    "href",
    "/login"
  );

  // 4. Cases list + case detail. `per` widens the page so the freshly created
  // case can't be pushed off page one by the accumulated dev-db fixtures.
  await anonPage.goto(`/public/${E2E.projectSlug}/cases?per=200`);
  const row = anonPage.locator(`[data-testid="public-case-link-${created.id}"]`);
  await expect(row).toHaveText(caseTitle);
  // The only <form> under /public is this GET search filter — never a POST.
  const forms = anonPage.locator("form");
  expect(await forms.count()).toBe(1);
  expect((await forms.first().getAttribute("method")) ?? "get").toMatch(/^get$/i);
  expect(await forms.first().getAttribute("action")).toBeNull();
  expect(await anonPage.locator('a[href^="/projects"]').count()).toBe(0);

  await row.click();
  await expect(anonPage.locator('[data-testid="public-case-title"]')).toHaveText(
    caseTitle
  );
  await expect(anonPage.locator('[data-testid="public-case-id"]')).toHaveText(
    created.displayId
  );
  const steps = anonPage.locator('[data-testid="public-case-steps"]');
  await expect(steps).toContainText("Open the login page");
  await expect(steps).toContainText("Form is visible");
  await expect(steps).toContainText("Dashboard loads");
  expect(await anonPage.locator("form").count()).toBe(0);

  // 5. noindex by default; flipping the toggle makes it indexable.
  const robots = anonPage.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);

  await page.check('[data-testid="public-share-indexable-toggle"]');
  await page.click('[data-testid="public-share-save"]');
  await expect(
    page.locator('[data-testid="public-share-indexable-toggle"]')
  ).toBeChecked();

  await expect(async () => {
    await anonPage.goto(`/public/${E2E.projectSlug}`);
    const content = await anonPage
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(content ?? "index").not.toContain("noindex");
  }).toPass({ timeout: 15_000 });

  // 6. Section toggle off → the whole cases area 404s, overview still renders.
  await page.uncheck('[data-testid="public-share-cases-toggle"]');
  await page.click('[data-testid="public-share-save"]');
  await expect(
    page.locator('[data-testid="public-share-cases-toggle"]')
  ).not.toBeChecked();

  await expectStatus(anon, `/public/${E2E.projectSlug}/cases`, 404);
  await expectStatus(
    anon,
    `/public/${E2E.projectSlug}/cases/${created.id}`,
    404
  );
  await expectStatus(anon, `/public/${E2E.projectSlug}`, 200);

  // 7. Sharing off entirely → every public URL is indistinguishable from a
  // project that never existed.
  await page.click('[data-testid="public-share-disable"]');
  await expect(page.locator('[data-testid="public-share-enable"]')).toBeVisible();

  await expectStatus(anon, `/public/${E2E.projectSlug}`, 404);
  await expectStatus(anon, `/public/${E2E.projectSlug}/cases`, 404);
  await expectStatus(
    anon,
    `/public/${E2E.projectSlug}/cases/${created.id}`,
    404
  );
  // A slug that was never shared behaves the same way.
  await expectStatus(anon, `/public/${E2E.targetProjectSlug}`, 404);

  await anon.close();
});
