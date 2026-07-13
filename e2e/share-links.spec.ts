import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-17 Public share links: create a link on a run, open /share/<token> in a
// fresh UNAUTHENTICATED context (read-only report, "Powered by TestForge",
// zero links back into the app), then revoke and confirm the page 404s.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-42 Share links: public run report, no-auth, revoke kills it`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. A run with one PASSED result, via the API.
  const casesRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases`
  );
  const cases = (await casesRes.json()).data as { id: string; title: string }[];
  const target = cases.find(
    (c) => c.title === "Valid login redirects to dashboard"
  )!;
  const runRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { data: { name: `Shared run ${ts}`, caseIds: [target.id] } }
  );
  const run = await runRes.json();
  await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
    { data: { caseId: target.id, status: "PASSED" } }
  );

  // 2. Create a share link from the run page.
  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  await page.click('[data-testid="share-create-button"]');
  const row = page.locator('[data-testid^="share-link-row-"]').first();
  await expect(row).toBeVisible();
  const token = (await row.getAttribute("data-token"))!;
  expect(token.length).toBeGreaterThanOrEqual(32);

  // 3. Open the public page with NO session at all.
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(`/share/${token}`);
  await expect(anonPage.getByText(`Shared run ${ts}`)).toBeVisible();
  await expect(anonPage.getByText("Powered by TestForge")).toBeVisible();
  await expect(anonPage.getByText(target.title)).toBeVisible();
  // Read-only: no links into the app, no buttons/forms at all.
  expect(await anonPage.locator('a[href*="/projects"]').count()).toBe(0);
  expect(await anonPage.locator("form, button").count()).toBe(0);

  // 4. A wrong token 404s.
  const bad = await anonPage.request.get(`/share/${"0".repeat(64)}`);
  expect(bad.status()).toBe(404);

  // 5. Revoke -> the public page dies.
  await page.click('[data-testid^="share-revoke-"]');
  await expect(page.getByText("No active links.")).toBeVisible();
  const after = await anonPage.request.get(`/share/${token}`);
  expect(after.status()).toBe(404);
  await anon.close();
});
