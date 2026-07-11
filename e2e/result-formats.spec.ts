import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-11: /api/v1/results accepts JUnit, TRX, NUnit3, xUnit.net v2, Cucumber
// JSON and Mocha JSON, all normalized through the same case-matching pipeline
// as the original /api/v1/junit (kept as a permanent alias).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

function fixture(name: string) {
  return fs.readFileSync(path.join(__dirname, "fixtures/results", name), "utf8");
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

const FORMATS: { format: string; file: string; contentType: string }[] = [
  { format: "junit", file: "junit.xml", contentType: "application/xml" },
  { format: "trx", file: "trx.xml", contentType: "application/xml" },
  { format: "nunit3", file: "nunit3.xml", contentType: "application/xml" },
  { format: "xunit2", file: "xunit2.xml", contentType: "application/xml" },
  { format: "cucumber", file: "cucumber.json", contentType: "application/json" },
  { format: "mocha", file: "mocha.json", contentType: "application/json" },
];

for (const { format, file, contentType } of FORMATS) {
  test(`TC-${TC}-21 ${format} upload matches by annotation & title, maps pass/fail`, async ({
    page,
  }) => {
    await login(page);
    const res = await page.request.post(
      `/api/v1/results?project=${E2E.projectSlug}&name=${format}%20fixture%20${Date.now()}&format=${format}`,
      { data: fixture(file), headers: { "Content-Type": contentType } }
    );
    expect(res.status(), await res.text()).toBe(201);
    const body = await res.json();
    expect(body.matched).toBe(2);
    expect(body.unmatched).toEqual([]);
    expect(body.stats).toEqual({ passed: 1, failed: 1, skipped: 0 });
    expect(body.status).toBe("COMPLETED");
    expect(body.runUrl).toContain(`/projects/${E2E.projectSlug}/runs/`);
  });
}

test(`TC-${TC}-22 format auto-detected from body when omitted`, async ({ page }) => {
  await login(page);

  const xmlRes = await page.request.post(
    `/api/v1/results?project=${E2E.projectSlug}&name=autodetect-xml-${Date.now()}`,
    { data: fixture("junit.xml"), headers: { "Content-Type": "application/xml" } }
  );
  expect(xmlRes.status(), await xmlRes.text()).toBe(201);
  expect((await xmlRes.json()).matched).toBe(2);

  const jsonRes = await page.request.post(
    `/api/v1/results?project=${E2E.projectSlug}&name=autodetect-json-${Date.now()}`,
    { data: fixture("cucumber.json"), headers: { "Content-Type": "application/json" } }
  );
  expect(jsonRes.status(), await jsonRes.text()).toBe(201);
  expect((await jsonRes.json()).matched).toBe(2);
});

test(`TC-${TC}-23 malformed upload returns 422 with a parse error`, async ({ page }) => {
  await login(page);
  const res = await page.request.post(
    `/api/v1/results?project=${E2E.projectSlug}&name=malformed-${Date.now()}&format=junit`,
    { data: fixture("malformed.xml"), headers: { "Content-Type": "application/xml" } }
  );
  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.error.code).toBe("validation_error");
  expect(body.error.details.length).toBeGreaterThan(0);
});

test(`TC-${TC}-24 legacy /api/v1/junit alias keeps its original response shape`, async ({
  page,
}) => {
  // /api/v1/junit predates guard() and only accepts a bare Bearer API key
  // (no browser-session auth) — unchanged on purpose, see result-ingest.ts.
  const apiKey = fs.readFileSync(path.join(__dirname, "../e2e-results/.api-key"), "utf8").trim();
  const res = await page.request.post(
    `/api/v1/junit?project=${E2E.projectSlug}&name=legacy-alias-${Date.now()}`,
    {
      data: fixture("junit.xml"),
      headers: { "Content-Type": "application/xml", Authorization: `Bearer ${apiKey}` },
    }
  );
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  expect(body.runId).toBeTruthy();
  expect(body.matched).toBe(2);
  expect(body.summary).toEqual({ passed: 1, failed: 1, skipped: 0 });
});
