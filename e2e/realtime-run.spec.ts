import { test, expect, type Page, type Browser } from "@playwright/test";
import { E2E } from "./global-setup";

// L-04 Real-time collaborative run execution: two logged-in users on one run
// see each other's presence and results live over SSE; conflicts surface a
// last-write-wins toast with Undo; with SSE blocked the executor degrades to
// exactly the pre-L-04 behavior; non-members can't even see the stream.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function newUserPage(browser: Browser, email: string, password: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, email, password);
  return { context, page };
}

/** Create a run (as the admin session) over two fixture cases. */
async function createRun(page: Page, name: string) {
  const casesRes = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases`
  );
  const cases = (await casesRes.json()).data as { id: string; title: string }[];
  const runRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { data: { name, caseIds: [cases[0].id, cases[1].id] } }
  );
  return (await runRes.json()) as { id: string };
}

const runUrl = (runId: string) =>
  `/projects/${E2E.projectSlug}/runs/${runId}`;

/** The two requests a session must complete before the other side can see it,
 *  and before it can see anything the other side does: the SSE subscription
 *  (whose first frame is the current presence snapshot — nothing published
 *  before it is subscribed gets replayed) and the heartbeat POST that puts this
 *  session into that snapshot. Waiting on them turns "the avatar never showed
 *  up in 20 s" into "this half of the handshake never landed", and lets the
 *  assertions that follow keep a timeout that matches what they actually wait
 *  for — one SSE frame — instead of covering for the handshake as well.
 *
 *  Register before navigating: Playwright only reports responses that arrive
 *  after the waiter exists. */
function handshake(p: Page, runId: string) {
  return Promise.all([
    p.waitForResponse((r) => r.url().includes(`/api/runs/${runId}/events`), {
      timeout: 20_000,
    }),
    p.waitForResponse(
      (r) =>
        r.url().includes(`/api/runs/${runId}/presence`) &&
        r.request().method() === "POST",
      { timeout: 20_000 }
    ),
  ]);
}

/** Bodies of every presence POST a session sends, beacons included (Chromium
 *  reports `sendBeacon` as a normal request). Mounting the executor must send
 *  heartbeats and nothing else — a `{leave:true}` among them is the regression
 *  that made this spec flaky, and naming it beats a bare visibility timeout. */
function presencePosts(p: Page, runId: string): string[] {
  const bodies: string[] = [];
  p.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes(`/api/runs/${runId}/presence`))
      bodies.push(r.postData() ?? "");
  });
  return bodies;
}

test(`TC-${TC}-48 Realtime: presence + live results across two sessions`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page, E2E.email, E2E.password);
  const run = await createRun(page, `Realtime run ${ts}`);
  const b = await newUserPage(browser, E2E.reviewerEmail, E2E.password);

  const beatsA = presencePosts(page, run.id);
  const beatsB = presencePosts(b.page, run.id);

  const readyA = handshake(page, run.id);
  await page.goto(runUrl(run.id));
  const readyB = handshake(b.page, run.id);
  await b.page.goto(runUrl(run.id));
  await Promise.all([readyA, readyB]);

  // Mounting is not leaving. A leave beacon sent while mounting races the
  // heartbeats around it — same client, four unordered requests — and deletes a
  // live session when it lands last, which is exactly the 20 s hole this test
  // used to fall into.
  expect(beatsA.filter((body) => body.includes('"leave"'))).toEqual([]);
  expect(beatsB.filter((body) => body.includes('"leave"'))).toEqual([]);

  // Presence: both sessions are in the map and both are subscribed, so each
  // side's avatar is one SSE frame away.
  await expect(
    page.locator('[data-testid="presence-avatar"]').first()
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    b.page.locator('[data-testid="presence-avatar"]').first()
  ).toBeVisible({ timeout: 10_000 });

  // A submits PASSED on the first case → B's row flashes + updates, no reload.
  const rowB = b.page
    .locator("button", { hasText: "Valid login redirects to dashboard" })
    .first();
  await page.click('[data-testid="submit-status-PASSED"]');
  await expect(rowB).toHaveClass(/bg-warning-soft/, { timeout: 3000 }); // flash
  await expect(rowB).toContainText("PASSED", { timeout: 2000 });

  // B leaves (navigation fires the leave beacon) → avatar gone from A fast.
  await b.page.goto("/dashboard");
  await expect(page.locator('[data-testid="presence-avatar"]')).toHaveCount(0, {
    timeout: 15_000,
  });
  await b.context.close();
});

test(`TC-${TC}-49 Realtime: conflict toast + Undo restores my value`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page, E2E.email, E2E.password);
  const run = await createRun(page, `Conflict run ${ts}`);
  const b = await newUserPage(browser, E2E.reviewerEmail, E2E.password);

  // A must be subscribed before B submits: result events go to whoever is on
  // the bus at publish time and are never replayed to a late subscriber.
  const readyA = handshake(page, run.id);
  await page.goto(runUrl(run.id));
  const readyB = handshake(b.page, run.id);
  await b.page.goto(runUrl(run.id));
  await Promise.all([readyA, readyB]);

  // Both sides work the SAME (first) case. B records FAILED…
  await b.page.click('[data-testid="submit-status-FAILED"]');
  const rowA = page
    .locator("button", { hasText: "Valid login redirects to dashboard" })
    .first();
  await expect(rowA).toContainText("FAILED", { timeout: 2000 });

  // …then A overwrites with PASSED inside B's 10 s conflict window.
  await page.locator("button", { hasText: "Valid login" }).first().click();
  await page.click('[data-testid="submit-status-PASSED"]');

  // B sees the last-write-wins toast naming A, with Undo.
  const toastB = b.page.locator('[data-testid="toast"]');
  await expect(toastB).toContainText("Overwritten by E2E User just now", {
    timeout: 3000,
  });
  const rowB = b.page
    .locator("button", { hasText: "Valid login redirects to dashboard" })
    .first();
  await expect(rowB).toContainText("PASSED");

  // Undo → B's FAILED comes back on both sides; A gets the mirror toast.
  await b.page.click('[data-testid="toast-action"]');
  await expect(rowB).toContainText("FAILED", { timeout: 3000 });
  await expect(rowA).toContainText("FAILED", { timeout: 3000 });
  await expect(page.locator('[data-testid="toast"]')).toContainText(
    "Overwritten by E2E Reviewer just now",
    { timeout: 3000 }
  );
  await b.context.close();
});

test(`TC-${TC}-50 Realtime: graceful degradation with SSE blocked; stream auth`, async ({
  page,
  browser,
}) => {
  const ts = Date.now();
  await login(page, E2E.email, E2E.password);
  const run = await createRun(page, `Degraded run ${ts}`);

  // SSE blocked at the network level → executor works exactly as before.
  const c = await browser.newContext();
  await c.route("**/api/runs/*/events", (route) => route.abort());
  const cPage = await c.newPage();
  await login(cPage, E2E.reviewerEmail, E2E.password);
  await cPage.goto(runUrl(run.id));
  await cPage.click('[data-testid="submit-status-PASSED"]');
  await expect(
    cPage
      .locator("button", { hasText: "Valid login redirects to dashboard" })
      .first()
  ).toContainText("PASSED", { timeout: 5000 });
  await c.close();

  // Anonymous stream → 401; a logged-in NON-member → 404 (no probing).
  const anon = await browser.newContext();
  expect(
    (await anon.request.get(`/api/runs/${run.id}/events`)).status()
  ).toBe(401);
  await anon.close();

  const outsider = await newUserPage(
    browser,
    E2E.twoFactorEmail,
    E2E.twoFactorPassword
  );
  expect(
    (await outsider.page.request.get(`/api/runs/${run.id}/events`)).status()
  ).toBe(404);
  await outsider.context.close();
});
