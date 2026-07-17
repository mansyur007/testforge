import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-30 XLSX & JSON export + saved CSV import column mapping.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-68 XLSX/JSON export: cases + run, full fidelity, revisions flag`, async ({
  page,
}) => {
  await login(page);
  const ts = Date.now();

  // 1. Cases XLSX — a real .xlsx is a zip archive ("PK" magic bytes).
  const casesXlsx = await page.request.get(
    `/api/export/cases-xlsx?project=${E2E.projectSlug}`
  );
  expect(casesXlsx.status()).toBe(200);
  expect(casesXlsx.headers()["content-type"]).toContain("spreadsheetml");
  const xlsxBuf = await casesXlsx.body();
  expect(xlsxBuf.subarray(0, 2).toString("latin1")).toBe("PK");

  // 2. Cases JSON — full fidelity, no revisions by default.
  const casesJson = await page.request.get(
    `/api/export/cases-json?project=${E2E.projectSlug}`
  );
  expect(casesJson.status()).toBe(200);
  const casesBody = await casesJson.json();
  expect(Array.isArray(casesBody.cases)).toBe(true);
  const sample = casesBody.cases[0];
  expect(sample).toHaveProperty("displayId");
  expect(sample).toHaveProperty("custom");
  expect(sample).toHaveProperty("steps");
  expect(sample.revisions).toBeUndefined();

  // 3. Cases JSON with ?revisions=true attaches each case's F-05 history —
  // create a case and edit it so at least one is guaranteed to have 2 revs,
  // regardless of what other specs have done to the shared project.
  const newCaseRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/cases`, {
    data: { title: `Revisioned case ${ts}` },
  });
  const newCase = await newCaseRes.json();
  await page.request.patch(`/api/v1/projects/${E2E.projectSlug}/cases/${newCase.id}`, {
    data: { title: `Revisioned case ${ts} (edited)` },
  });

  const withRevisions = await page.request.get(
    `/api/export/cases-json?project=${E2E.projectSlug}&revisions=true`
  );
  const revBody = await withRevisions.json();
  expect(Array.isArray(revBody.cases[0].revisions)).toBe(true);
  const caseWithHistory = revBody.cases.find((c: { id: string; revisions: unknown[] }) => c.id === newCase.id);
  expect(caseWithHistory.revisions.length).toBe(2);

  // 4. Run XLSX/JSON — create a run with a real result first.
  const casesRes = await page.request.get(`/api/v1/projects/${E2E.projectSlug}/cases`);
  const targetCase = (await casesRes.json()).data[0];
  const runRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs`, {
    data: { name: `Export run ${ts}`, caseIds: [targetCase.id] },
  });
  const run = await runRes.json();
  await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`, {
    data: { caseId: targetCase.id, status: "PASSED" },
  });

  const runXlsx = await page.request.get(`/api/export/run-xlsx?id=${run.id}`);
  expect(runXlsx.status()).toBe(200);
  expect((await runXlsx.body()).subarray(0, 2).toString("latin1")).toBe("PK");

  const runJson = await page.request.get(`/api/export/run-json?id=${run.id}`);
  const runBody = await runJson.json();
  expect(runBody.run.id).toBe(run.id);
  expect(runBody.results[0].case.displayId).toBe(targetCase.displayId);
  expect(runBody.results[0].status).toBe("PASSED");
});

test(`TC-${TC}-69 CSV import: column mapping maps mismatched headers, then persists per project`, async ({
  page,
}) => {
  await login(page);
  const ts = Date.now();
  const title = `Mapped case ${ts}`;

  // A CSV whose header doesn't match the expected "title" column at all.
  const csv = `Case Name\n"${title}"\n`;

  // 1. First upload: preview shows the detected header, row is initially
  // invalid (no "title" column), map "Case Name" -> title, re-preview -> valid.
  await page.goto(`/projects/${E2E.projectSlug}/import`);
  await page.setInputFiles('[data-testid="csv-file-input"]', {
    name: "mapped.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.click('[data-testid="csv-preview-button"]');
  await expect(page.locator('[data-testid="csv-mapping-toggle"]')).toContainText(
    "1 columns detected"
  );
  await page.click('[data-testid="csv-mapping-toggle"]');
  await page.selectOption('[data-testid="csv-mapping-title"]', "case name");
  await page.click('[data-testid="csv-preview-button"]');
  await expect(page.getByText("✓ valid")).toBeVisible();

  // 2. Commit — the mapping checkbox defaults to checked, so it's saved too.
  await page.click('[data-testid="csv-import-button"]');
  await expect(page.locator('[data-testid="csv-import-message"]')).toContainText(
    "1 test cases imported"
  );

  // 3. The saved mapping is retrievable via the API directly.
  const mappingRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/import-mapping`
  );
  const saved = (await mappingRes.json()).mapping;
  expect(saved.title.toLowerCase()).toBe("case name");

  // 4. A FRESH page load pre-fills the mapping from what was saved — a second
  // file with the same mismatched header validates without remapping.
  await page.goto(`/projects/${E2E.projectSlug}/import`);
  const title2 = `Mapped case 2 ${ts}`;
  await page.setInputFiles('[data-testid="csv-file-input"]', {
    name: "mapped2.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Case Name\n"${title2}"\n`),
  });
  await page.click('[data-testid="csv-preview-button"]');
  await expect(page.getByText("✓ valid")).toBeVisible();
  await page.click('[data-testid="csv-import-button"]');
  await expect(page.locator('[data-testid="csv-import-message"]')).toContainText(
    "1 test cases imported"
  );
});
