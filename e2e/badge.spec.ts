import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// L-01 Quality badge: enable from Settings → Badge on the project API page,
// fetch the public SVG/JSON with NO session, check the pass-rate math against
// a freshly completed run, then revoke and confirm both formats 404.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-47 Quality badge: public SVG, correct pass rate, revoke kills it`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. A COMPLETED run with 1 PASS + 1 FAIL → pass rate 50.0%.
  const casesRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases`
  );
  const cases = (await casesRes.json()).data as { id: string; title: string }[];
  const runRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { data: { name: `Badge run ${ts}`, caseIds: [cases[0].id, cases[1].id] } }
  );
  const run = await runRes.json();
  await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
    { data: { caseId: cases[0].id, status: "PASSED" } }
  );
  await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
    { data: { caseId: cases[1].id, status: "FAILED" } }
  );
  await page.request.patch(
    `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}`,
    { data: { status: "COMPLETED" } }
  );

  // 2. Enable the badge from the project API page.
  await page.goto(`/projects/${E2E.projectSlug}/api`);
  await page.click('[data-testid="badge-enable-button"]');
  const preview = page.locator('[data-testid="badge-preview"]');
  await expect(preview).toBeVisible();
  const token = (await preview.getAttribute("data-token"))!;
  expect(token.length).toBeGreaterThanOrEqual(32);

  // 3. Fetch the SVG and JSON with NO session at all.
  const anon = await browser.newContext();
  const svgRes = await anon.request.get(`/badge/${token}.svg`);
  expect(svgRes.status()).toBe(200);
  expect(svgRes.headers()["content-type"]).toContain("image/svg+xml");
  expect(svgRes.headers()["cache-control"]).toContain("max-age=300");
  const svg = await svgRes.text();
  expect(svg).toContain("pass rate");
  expect(svg).toContain("50.0%");
  expect(svg).toContain("#e05d44"); // <70 → red

  const jsonRes = await anon.request.get(
    `/badge/${token}.json?metric=cases&label=my cases`
  );
  const shieldJson = await jsonRes.json();
  expect(shieldJson.schemaVersion).toBe(1);
  expect(shieldJson.label).toBe("my cases");
  expect(Number(shieldJson.message)).toBeGreaterThan(0);

  // 4. Revoke → both formats 404.
  await page.click('[data-testid="badge-revoke-button"]');
  await expect(page.locator('[data-testid="badge-enable-button"]')).toBeVisible();
  expect((await anon.request.get(`/badge/${token}.svg`)).status()).toBe(404);
  expect((await anon.request.get(`/badge/${token}.json`)).status()).toBe(404);
  await anon.close();
});
