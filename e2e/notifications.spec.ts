import http from "node:http";
import type { AddressInfo } from "node:net";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";
import {
  slackMessage,
  discordMessage,
  teamsCard,
  emailMessage,
  validateWebhookTarget,
} from "../src/lib/notifications";

// F-08 Notifications: formatter unit checks (pure functions, node-side) plus
// the end-to-end flow against a local HTTP receiver — create a Slack channel,
// send a test message, complete a run, and assert the delivered payloads.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// ---------------------------------------------------------------------------
// Formatter unit checks (spec F-08 test plan). No page involved.
// ---------------------------------------------------------------------------
test(`TC-${TC}-15 Notification formatters produce the expected shapes`, () => {
  const data = {
    title: "Run completed: Smoke",
    url: "https://tf.example/projects/x/runs/1",
    tone: "bad" as const,
    fields: [{ label: "Failed", value: "3" }],
  };

  const slack = slackMessage("run.completed", data);
  expect(slack.text).toContain("Run completed: Smoke");
  expect(JSON.stringify(slack.blocks)).toContain(data.url);

  const discord = discordMessage("run.completed", data);
  expect(discord.embeds[0].color).toBe(0xef4444); // bad → red
  expect(discord.embeds[0].fields[0]).toEqual({
    name: "Failed",
    value: "3",
    inline: true,
  });

  const teams = teamsCard("run.completed", data) as {
    attachments: { content: { actions?: { url: string }[] } }[];
  };
  expect(teams.attachments[0].content.actions?.[0].url).toBe(data.url);

  const mail = emailMessage("run.completed", data);
  expect(mail.subject).toBe("[TestForge] run.completed: Run completed: Smoke");
  expect(mail.html).toContain(data.url);

  // Host allowlist (env override is only read at validation time inside the
  // app server; here in the test process it is unset → strict rules apply).
  expect(validateWebhookTarget("SLACK", "https://hooks.slack.com/services/x")).toBeNull();
  expect(validateWebhookTarget("SLACK", "https://evil.example.com/x")).toContain("Host not allowed");
  expect(validateWebhookTarget("DISCORD", "http://discord.com/api/webhooks/1")).toContain("https");
  expect(validateWebhookTarget("TEAMS", "https://corp.webhook.office.com/x")).toBeNull();
  expect(validateWebhookTarget("EMAIL", "")).toBeNull();
});

// ---------------------------------------------------------------------------
// End-to-end against a local receiver.
// ---------------------------------------------------------------------------
async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

type Delivery = { path: string; body: Record<string, unknown> };

function startReceiver(): Promise<{
  url: string;
  deliveries: Delivery[];
  close: () => Promise<void>;
}> {
  const deliveries: Delivery[] = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        deliveries.push({ path: req.url ?? "", body: JSON.parse(raw) });
      } catch {
        deliveries.push({ path: req.url ?? "", body: { raw } });
      }
      res.writeHead(200).end("ok");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        deliveries,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

test(`TC-${TC}-16 Slack channel: test message, run.completed delivery, event filtering`, async ({
  page,
}) => {
  const receiver = await startReceiver();
  const ts = Date.now();
  const channelName = `#qa-alerts-${ts}`;

  try {
    await login(page);

    // 1. Create a SLACK channel subscribed ONLY to run.completed.
    await page.goto(`/projects/${E2E.projectSlug}/notifications`);
    await page.fill('[data-testid="channel-name-input"]', channelName);
    await page.fill('[data-testid="channel-url-input"]', `${receiver.url}/slack`);
    for (const ev of [
      "case.created",
      "case.updated",
      "case.deleted",
      "case.assigned",
      "run.created",
      "result.failed",
      "issue.created",
      "plan.created",
      "plan.completed",
      "milestone.completed",
    ])
      await page.uncheck(`input[name="events"][value="${ev}"]`);
    await page.click('[data-testid="channel-form-submit"]');
    await expect(
      page.locator(`[data-testid="channel-row-${channelName}"]`)
    ).toBeVisible();

    // 2. A malformed target is rejected server-side with a form error.
    await page.fill('[data-testid="channel-name-input"]', "bad target");
    await page.fill('[data-testid="channel-url-input"]', "not-a-url");
    await page.click('[data-testid="channel-form-submit"]');
    await expect(page.locator('[data-testid="channel-form-error"]')).toContainText(
      "valid URL"
    );

    // 3. "Send test message" delivers and reports success inline.
    await page
      .locator(`[data-testid="channel-row-${channelName}"] button`, {
        hasText: "Send test",
      })
      .click();
    await expect(page.locator('[data-testid="channel-test-ok"]')).toBeVisible();
    expect(receiver.deliveries).toHaveLength(1);
    expect(JSON.stringify(receiver.deliveries[0].body)).toContain(
      "Test message from TestForge"
    );

    // 4. Create a run via API (run.created — channel is NOT subscribed) …
    const caseRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/cases`,
      { data: { title: `Notify case ${ts}` } }
    );
    const { id: caseId } = await caseRes.json();
    const runRes = await page.request.post(
      `/api/v1/projects/${E2E.projectSlug}/runs`,
      { data: { name: `Notify run ${ts}`, caseIds: [caseId] } }
    );
    const run = await runRes.json();

    // … then complete it in the UI (run.completed — subscribed).
    await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
    await page.getByRole("button", { name: "✓ Mark Complete" }).click();
    await expect
      .poll(() => receiver.deliveries.length, { timeout: 10_000 })
      .toBe(2);

    // Only run.completed arrived (run.created was filtered), formatted with
    // a link back to the run.
    const payload = JSON.stringify(receiver.deliveries[1].body);
    expect(payload).toContain(`Run completed: Notify run ${ts}`);
    expect(payload).toContain(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  } finally {
    await receiver.close();
  }
});
