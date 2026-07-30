import { PrismaClient } from "@prisma/client";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-38 Public project sharing ("portfolio mode"): the owner publishes the
// project from Settings → Public sharing, then a fully UNAUTHENTICATED context
// browses /public/<slug> and its test cases. Every toggle is checked from that
// anonymous context — the point of the feature is what a stranger can and
// cannot reach.
//
// Isolation: this spec seeds its own project per run. The local e2e DB
// persists, so reusing the shared "e2e" project would let a previous run's
// PublicShare row decide what "the default" looks like — and the noindex
// default is exactly what this spec has to prove.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const db = new PrismaClient();

const CASE_TITLE = "Checkout rejects an expired card";
const RUN_NAME = "Regression 2026-07";
// Planted in the seeded run's result. Neither string may appear anywhere under
// /public once Runs and Reports are on — they stand in for the tester notes and
// tracker links that make execution data more sensitive than case design.
const SECRET_COMMENT = "INTERNAL staging creds are in the vault";
const SECRET_DEFECT_URL = "https://jira.internal.example/browse/SEC-1";

async function seedProject() {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: E2E.email },
    select: { id: true, name: true },
  });
  const slug = `share-${Date.now()}`;
  const project = await db.project.create({
    data: {
      name: `Public share ${slug}`,
      slug,
      description: "A portfolio project published with TestForge",
      createdById: admin.id,
      caseCounter: 1,
      members: { create: { userId: admin.id, role: "OWNER" } },
      suites: { create: { name: "Checkout", order: 0 } },
    },
    select: { id: true, suites: { select: { id: true } } },
  });
  const testCase = await db.testCase.create({
    data: {
      projectId: project.id,
      suiteId: project.suites[0].id,
      seq: 1,
      title: CASE_TITLE,
      preconditions: "A card that expired last month is on file",
      stepsJson: JSON.stringify([
        { action: "Open the checkout page", expected: "Payment form is shown" },
      ]),
      expectedResult: "An expiry error is shown and no charge is made",
      priority: "HIGH",
      type: "SMOKE",
      tags: "portfolio",
    },
    select: { id: true },
  });
  const run = await db.testRun.create({
    data: {
      projectId: project.id,
      name: RUN_NAME,
      description: "Internal scope notes for the release",
      status: "COMPLETED",
      origin: "CI · GitHub Actions (Linux)",
      createdById: admin.id,
      completedAt: new Date(),
      results: {
        create: {
          caseId: testCase.id,
          status: "PASSED",
          assigneeId: admin.id,
          comment: SECRET_COMMENT,
          defectUrl: SECRET_DEFECT_URL,
        },
      },
    },
    select: { id: true },
  });
  return {
    slug,
    caseId: testCase.id,
    suiteId: project.suites[0].id,
    runId: run.id,
    adminName: admin.name,
  };
}

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
  const project = await seedProject();
  await login(page);

  // Before sharing is on, the public URL is indistinguishable from a project
  // that never existed.
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await expectStatus(anon, `/public/${project.slug}`, 404);

  // 1. Publish the project.
  await page.goto(`/projects/${project.slug}/sharing`);
  await page.click('[data-testid="public-share-enable"]');
  await expect(page.locator('[data-testid="public-share-disable"]')).toBeVisible();
  await expect(page.locator('[data-testid="public-share-url"]')).toContainText(
    `/public/${project.slug}`
  );
  // Fresh share defaults: cases shown, search engines kept out.
  await expect(
    page.locator('[data-testid="public-share-cases-toggle"]')
  ).toBeChecked();
  await expect(
    page.locator('[data-testid="public-share-indexable-toggle"]')
  ).not.toBeChecked();
  // Runs and Reports are opt-in: publishing a project never publishes its
  // execution history by itself.
  await expect(
    page.locator('[data-testid="public-share-runs-toggle"]')
  ).not.toBeChecked();
  await expect(
    page.locator('[data-testid="public-share-reports-toggle"]')
  ).not.toBeChecked();
  await expectStatus(anon, `/public/${project.slug}/runs`, 404);
  await expectStatus(anon, `/public/${project.slug}/reports`, 404);

  // 2. Overview renders with NO session at all.
  await anonPage.goto(`/public/${project.slug}`);
  await expect(
    anonPage.locator('[data-testid="public-overview-title"]')
  ).toHaveText(`Public share ${project.slug}`);
  await expect(
    anonPage.locator('[data-testid="public-readonly-chip"]')
  ).toBeVisible();
  await expect(
    anonPage.locator('[data-testid="public-stat-cases"] p').last()
  ).toHaveText("1");

  // Read-only discipline: no mutation surface, no links back into the app
  // other than the "Built with TestForge" CTA to /login.
  expect(await anonPage.locator("form").count()).toBe(0);
  expect(await anonPage.locator('a[href^="/projects"]').count()).toBe(0);
  await expect(anonPage.locator('[data-testid="public-cta-link"]')).toHaveAttribute(
    "href",
    "/login"
  );

  // noindex by default.
  await expect(anonPage.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/
  );

  // 3. Cases list + case detail.
  await anonPage.goto(`/public/${project.slug}/cases`);
  const row = anonPage.locator(
    `[data-testid="public-case-link-${project.caseId}"]`
  );
  await expect(row).toHaveText(CASE_TITLE);
  // The only <form> under /public is this GET search filter — never a POST.
  const forms = anonPage.locator("form");
  expect(await forms.count()).toBe(1);
  expect((await forms.first().getAttribute("method")) ?? "get").toMatch(/^get$/i);
  expect(await forms.first().getAttribute("action")).toBeNull();
  expect(await anonPage.locator('a[href^="/projects"]').count()).toBe(0);

  await row.click();
  await expect(anonPage.locator('[data-testid="public-case-title"]')).toHaveText(
    CASE_TITLE
  );
  await expect(anonPage.locator('[data-testid="public-case-id"]')).toHaveText(
    `TC-${project.slug.toUpperCase()}-001`
  );
  const steps = anonPage.locator('[data-testid="public-case-steps"]');
  await expect(steps).toContainText("Open the checkout page");
  await expect(steps).toContainText("Payment form is shown");
  await expect(steps).toContainText(
    "An expiry error is shown and no charge is made"
  );
  expect(await anonPage.locator("form").count()).toBe(0);

  // 4. Runs + Reports: turning them on publishes the shape of the execution
  // history and nothing that sits inside a result.
  await page.check('[data-testid="public-share-runs-toggle"]');
  await page.check('[data-testid="public-share-reports-toggle"]');
  await page.click('[data-testid="public-share-save"]');
  await expect(
    page.locator('[data-testid="public-share-runs-toggle"]')
  ).toBeChecked();

  await expectStatus(anon, `/public/${project.slug}/runs`, 200);
  await anonPage.goto(`/public/${project.slug}/runs`);
  await expect(
    anonPage.locator(`[data-testid="public-run-${project.runId}"]`)
  ).toContainText(RUN_NAME);

  await anonPage.goto(`/public/${project.slug}/reports`);
  await expect(
    anonPage.locator('[data-testid="public-report-pass-rate"] p').last()
  ).toHaveText("100%");
  await expect(
    anonPage.locator('[data-testid="public-report-executions"] p').last()
  ).toHaveText("1");

  // The whole reason these toggles are separate: what a result carries must
  // not ride along with the tally it contributes to.
  for (const path of [`/runs`, `/reports`]) {
    const res = await anon.request.get(`/public/${project.slug}${path}`);
    const body = await res.text();
    for (const secret of [
      SECRET_COMMENT,
      SECRET_DEFECT_URL,
      project.adminName,
      E2E.email,
      "CI · GitHub Actions",
      "Internal scope notes",
    ])
      expect(body, `${path} must not leak "${secret}"`).not.toContain(secret);
    expect(body).not.toContain("/projects/");
  }

  // 5. Turning indexing on flips the robots meta.
  await page.check('[data-testid="public-share-indexable-toggle"]');
  await page.click('[data-testid="public-share-save"]');
  await expect(
    page.locator('[data-testid="public-share-indexable-toggle"]')
  ).toBeChecked();

  await expect(async () => {
    await anonPage.goto(`/public/${project.slug}`);
    const content = await anonPage
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(content ?? "index").not.toContain("noindex");
  }).toPass({ timeout: 15_000 });

  // F-40: …and puts the project into sitemap.xml. Only indexable shares are
  // listed, so this is the one assertion that proves the DB half of the sitemap.
  const sitemap = await (await anon.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/public/${project.slug}</loc>`);
  expect(sitemap).toContain(`/public/${project.slug}/cases</loc>`);

  // 5. Section toggle off → the whole cases area 404s, overview still renders.
  await page.uncheck('[data-testid="public-share-cases-toggle"]');
  await page.click('[data-testid="public-share-save"]');
  await expect(
    page.locator('[data-testid="public-share-cases-toggle"]')
  ).not.toBeChecked();

  await expectStatus(anon, `/public/${project.slug}/cases`, 404);
  await expectStatus(
    anon,
    `/public/${project.slug}/cases/${project.caseId}`,
    404
  );
  await expectStatus(anon, `/public/${project.slug}`, 200);

  // 6. Sharing off entirely → every public URL 404s again.
  await page.click('[data-testid="public-share-disable"]');
  await expect(page.locator('[data-testid="public-share-enable"]')).toBeVisible();

  await expectStatus(anon, `/public/${project.slug}`, 404);
  await expectStatus(anon, `/public/${project.slug}/cases`, 404);
  await expectStatus(
    anon,
    `/public/${project.slug}/cases/${project.caseId}`,
    404
  );

  await anon.close();
});

test.afterAll(async () => {
  await db.$disconnect();
});
