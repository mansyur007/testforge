import http from "node:http";
import type { AddressInfo } from "node:net";
import { PrismaClient } from "@prisma/client";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";
import { encrypt, decrypt } from "../src/lib/crypto";
import { parseIssueKey, isIssueClosed } from "../src/lib/issue-providers";

// F-07 Issue tracker integration. The provider clients run server-side, so
// page.route() cannot intercept them — instead the integration's baseUrl points
// at a real local HTTP mock of the GitHub API (the app allows an http base only
// because playwright.config sets TF_ALLOW_INSECURE_INTEGRATION_URL=1).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const GOOD_TOKEN = "ghp_valid_token";

// ---------------------------------------------------------------------------
// Pure-function checks: crypto round-trip and key parsing.
// ---------------------------------------------------------------------------
test(`TC-${TC}-17 Crypto round-trip and issue-key parsing`, () => {
  const secret = "jira-token-with-üñïçø∂é";
  const payload = encrypt(secret);
  expect(payload.startsWith("v1:")).toBe(true);
  expect(payload).not.toContain(secret); // ciphertext, not obfuscation
  expect(decrypt(payload)).toBe(secret);

  // AES-GCM authenticates: a flipped ciphertext byte must fail, not decode.
  const parts = payload.split(":");
  const tampered = Buffer.from(parts[3], "base64");
  tampered[0] ^= 0xff;
  parts[3] = tampered.toString("base64");
  expect(() => decrypt(parts.join(":"))).toThrow();

  expect(parseIssueKey("JIRA", "qa-123")).toBe("QA-123");
  expect(parseIssueKey("JIRA", "https://x.atlassian.net/browse/QA-9")).toBe("QA-9");
  expect(parseIssueKey("JIRA", "42")).toBeNull();
  expect(parseIssueKey("GITHUB", "#42")).toBe("42");
  expect(parseIssueKey("GITHUB", "https://github.com/o/r/issues/42")).toBe("42");
  expect(parseIssueKey("GITHUB", "QA-1")).toBeNull();

  expect(isIssueClosed("Done")).toBe(true);
  expect(isIssueClosed("closed")).toBe(true);
  expect(isIssueClosed("In Progress")).toBe(false);
  expect(isIssueClosed(null)).toBe(false);
});

// ---------------------------------------------------------------------------
// Mock GitHub API. Rejects a wrong token so AC 2 is exercised for real.
// ---------------------------------------------------------------------------
type MockState = { issueState: "open" | "closed"; created: { title: string; body: string }[] };

function startMockGitHub(): Promise<{
  url: string;
  state: MockState;
  close: () => Promise<void>;
}> {
  const state: MockState = { issueState: "open", created: [] };
  const server = http.createServer((req, res) => {
    const json = (code: number, body: unknown) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== `Bearer ${GOOD_TOKEN}`)
      return json(401, { message: "Bad credentials" });

    const url = req.url ?? "";
    const issueUrl = "https://github.example/o/r/issues/42";

    if (req.method === "GET" && url === "/repos/o/r")
      return json(200, { full_name: "o/r" }); // testConnection

    if (req.method === "POST" && url === "/repos/o/r/issues") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        state.created.push(JSON.parse(raw));
        json(201, { number: 42, html_url: issueUrl });
      });
      return;
    }

    if (req.method === "GET" && url.startsWith("/repos/o/r/issues/42"))
      return json(200, {
        number: 42,
        html_url: issueUrl,
        title: "Mocked issue",
        state: state.issueState,
      });

    return json(404, { message: "Not Found" });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        state,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function connectGitHub(page: Page, mockUrl: string, token: string) {
  await page.goto(`/projects/${E2E.projectSlug}/integrations`);
  await page.selectOption('[data-testid="integration-provider-select"]', "GITHUB");
  await page.fill('[data-testid="integration-baseurl-input"]', mockUrl);
  await page.fill('[data-testid="integration-target-input"]', "o/r");
  await page.fill('[data-testid="integration-token-input"]', token);
  await page.click('[data-testid="integration-save"]');
}

test(`TC-${TC}-18 GitHub integration: bad token rejected, issue filed from failure, status syncs`, async ({
  page,
}) => {
  const mock = await startMockGitHub();
  const db = new PrismaClient();
  const ts = Date.now();

  try {
    await login(page);

    // 1. AC 2 — a wrong token surfaces the provider's error and saves nothing.
    await connectGitHub(page, mock.url, "ghp_wrong");
    await expect(page.locator('[data-testid="integration-form-error"]')).toContainText(
      "Bad credentials"
    );
    expect(
      await db.integration.count({ where: { project: { slug: E2E.projectSlug } } })
    ).toBe(0);

    // 2. A good token verifies against the provider and is stored.
    await connectGitHub(page, mock.url, GOOD_TOKEN);
    await expect(page.locator('[data-testid="integration-row-GITHUB"]')).toBeVisible();

    // AC 4 — the token is encrypted at rest and never rendered.
    const stored = await db.integration.findFirstOrThrow({
      where: { project: { slug: E2E.projectSlug } },
    });
    expect(stored.authEnc).not.toContain(GOOD_TOKEN);
    expect(stored.authEnc.startsWith("v1:")).toBe(true);
    expect(await page.content()).not.toContain(GOOD_TOKEN);

    // 3. Seed a FAILED result through the API.
    const caseRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/cases`,
      {
        data: {
          title: `Issue case ${ts}`,
          steps: [{ action: `Open the widget ${ts}`, expected: "It opens" }],
          expectedResult: "The widget opens",
        },
      }
    );
    const { id: caseId } = await caseRes.json();
    const runRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs`,
      { data: { name: `Issue run ${ts}`, caseIds: [caseId] } }
    );
    const run = await runRes.json();
    await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`,
      { data: { caseId, status: "FAILED", comment: "Widget stayed closed" } }
    );

    // 4. AC 1 — file the issue from the failed result.
    await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
    await page.click('[data-testid="issue-create-open"]');
    const body = page.locator('[data-testid="issue-create-body"]');
    await expect(body).toBeVisible();
    await expect(body).toHaveValue(/Open the widget/); // steps expanded into the report
    await expect(body).toHaveValue(/Widget stayed closed/); // actual result
    await expect(page.locator('[data-testid="issue-create-title"]')).toHaveValue(
      new RegExp(`Issue case ${ts}`)
    );
    await page.click('[data-testid="issue-create-submit"]');

    await expect(page.locator('[data-testid="issue-badge-42"]')).toBeVisible();
    expect(mock.state.created).toHaveLength(1);
    expect(mock.state.created[0].body).toContain("Steps to reproduce");

    // defectUrl keeps the legacy plain-URL reports working.
    const result = await db.testRunResult.findFirstOrThrow({ where: { caseId } });
    expect(result.defectUrl).toBe("https://github.example/o/r/issues/42");

    // AC 4 — the API exposes the link but never the credentials.
    const listRes = await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/issues?entityType=RESULT`
    );
    const listBody = await listRes.text();
    expect(listBody).toContain("github.example");
    expect(listBody).not.toContain(GOOD_TOKEN);
    expect(listBody).not.toContain("authEnc");

    // 5. AC 3 — the issue closes upstream; the sync cron turns the badge green.
    mock.state.issueState = "closed";
    await db.issueLink.updateMany({
      where: { entityId: result.id },
      data: { syncedAt: new Date(Date.now() - 60 * 60_000) }, // force staleness
    });
    const cron = await page.request.get("/api/cron/sync-issues", {
      headers: { Authorization: "Bearer e2e-cron-secret" },
    });
    expect(cron.ok()).toBe(true);
    expect((await cron.json()).updated).toBeGreaterThan(0);

    await page.reload();
    const badge = page.locator('[data-testid="issue-badge-42"]');
    await expect(badge).toContainText("Closed");
    await expect(badge).toHaveClass(/bg-green-100/);
  } finally {
    await db.$disconnect();
    await mock.close();
  }
});
