import { test, expect, type Page } from "@playwright/test";
import http from "node:http";
import { E2E } from "./global-setup";

// F-29 AI assist (BYO key): org config, generate-cases-from-requirement (mock
// Anthropic-compatible endpoint), and the no-key trigram near-duplicate
// detector. The AI calls run server-side, so page.route() can't intercept them
// — a real local HTTP mock stands in for the provider, same technique as the
// OIDC/webhook mocks.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const MOCK_PORT = 9898;

// Minimal Anthropic-compatible Messages endpoint. Branches on the system prompt:
// the edge-case-suggestion / connectivity path returns a steps array; the
// generation path returns a canned list of cases.
function startMockAnthropic(cases: unknown): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const parsed = JSON.parse(body || "{}");
        const system: string = parsed.system ?? "";
        const text = system.includes("ADDITIONAL")
          ? JSON.stringify([{ action: "Try an expired token", expected: "Rejected" }])
          : JSON.stringify(cases);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ content: [{ type: "text", text }] }));
      });
    });
    server.listen(MOCK_PORT, "127.0.0.1", () => resolve(server));
  });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-77 AI assist: configure BYO key, generate DRAFT cases, disable`, async ({
  page,
}) => {
  const ts = Date.now();
  const genTitle = `AI login validation ${ts}`;
  const server = await startMockAnthropic([
    {
      title: genTitle,
      priority: "HIGH",
      type: "FUNCTIONAL",
      preconditions: "User is registered",
      steps: [{ action: "Enter valid credentials", expected: "Signed in" }],
      expectedResult: "Dashboard shown",
    },
  ]);

  try {
    await login(page);

    // 1. Configure the org's AI (endpoint points at the local mock).
    await page.goto("/settings/ai");
    await expect(page.locator('[data-testid="ai-status"]')).toHaveText("Not configured");
    await page.fill('[data-testid="ai-endpoint"]', `http://127.0.0.1:${MOCK_PORT}`);
    await page.fill('[data-testid="ai-model"]', "claude-sonnet-5");
    await page.fill('[data-testid="ai-key"]', "test-key");
    await page.click('[data-testid="ai-save"]');
    await expect(page.locator('[data-testid="ai-saved"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-status"]')).toHaveText("Configured");

    // 2. Test connection round-trips the mock.
    await page.click('[data-testid="ai-test"]');
    await expect(page.locator('[data-testid="ai-test-result"]')).toContainText(
      "successful"
    );

    // 3. Generate cases from a requirement → preview → insert as DRAFT.
    await page.goto(`/projects/${E2E.projectSlug}`);
    await page.click('[data-testid="ai-generate-open"]');
    await page.fill(
      '[data-testid="ai-generate-input"]',
      "As a user I can log in with valid credentials."
    );
    await page.click('[data-testid="ai-generate-submit"]');
    await expect(page.locator('[data-testid="ai-generate-preview"]')).toContainText(
      genTitle
    );
    await page.click('[data-testid="ai-generate-insert"]');
    await expect(page.locator('[data-testid="ai-generate-modal"]')).toHaveCount(0);

    // The inserted case exists with DRAFT status.
    await expect
      .poll(async () => {
        const res = await page.request.get(
          `/api/v1/projects/${E2E.projectSlug}/cases?limit=200`
        );
        const data = (await res.json()).data as { title: string; status: string }[];
        return data.find((c) => c.title === genTitle)?.status;
      })
      .toBe("DRAFT");

    // 4. Disable AI → the generate button no longer appears.
    await page.goto("/settings/ai");
    await page.click('[data-testid="ai-clear"]');
    await expect(page.locator('[data-testid="ai-status"]')).toHaveText("Not configured");
    await page.goto(`/projects/${E2E.projectSlug}`);
    await expect(page.locator('[data-testid="ai-generate-open"]')).toHaveCount(0);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test(`TC-${TC}-78 AI assist: near-duplicate detection needs no key`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  const base = `Reset password via email link ${ts}`;
  const similar = `Reset password using email link ${ts}`;
  const mk = async (title: string) => {
    const res = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/cases`,
      { data: { title } }
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    return (await res.json()).id as string;
  };
  const firstId = await mk(base);
  await mk(similar);

  // The near-duplicate panel surfaces the similar-titled sibling — no AI key
  // configured (this test never touches /settings/ai).
  await page.goto(`/projects/${E2E.projectSlug}/cases/${firstId}`);
  const panel = page.locator('[data-testid="near-duplicates-panel"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(similar);
});
