import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-41 Instance console: the operator credential (static, from env) unlocks a
// read-only list of every registered user across organizations. Ordinary
// sessions must not reach it, and a wrong password must not either.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// Mirrors playwright.config.ts → webServer.command.
const SUPERADMIN_USER = "e2e-superadmin";
const SUPERADMIN_PASSWORD = "e2e-superadmin-password-long-enough";

const db = new PrismaClient();

/** Sign in at the console's own login. TC-*-81 is what proves this gate works;
 *  everything after it just needs to be through the door. */
async function operatorLogin(page: Page) {
  await page.goto("/superadmin/login");
  await page.fill('[data-testid="superadmin-username"]', SUPERADMIN_USER);
  await page.fill('[data-testid="superadmin-password"]', SUPERADMIN_PASSWORD);
  await page.click('[data-testid="superadmin-submit"]');
  await page.waitForURL("**/superadmin");
}

test(`TC-${TC}-81 Instance console: operator sees every registered user`, async ({
  page,
}) => {
  // 1. Signed out → the console bounces to its own login, not the app's.
  await page.goto("/superadmin");
  await page.waitForURL("**/superadmin/login");

  // 2. Wrong password is rejected with a generic message.
  await page.fill('[data-testid="superadmin-username"]', SUPERADMIN_USER);
  await page.fill('[data-testid="superadmin-password"]', "wrong-password-here");
  await page.click('[data-testid="superadmin-submit"]');
  await expect(page.locator('[data-testid="superadmin-error"]')).toContainText(
    "Invalid credentials"
  );

  // 3. Correct credentials land on the list, which spans organizations: the
  //    seeded org admin and the org-less "Outsider" both appear.
  await page.fill('[data-testid="superadmin-username"]', SUPERADMIN_USER);
  await page.fill('[data-testid="superadmin-password"]', SUPERADMIN_PASSWORD);
  await page.click('[data-testid="superadmin-submit"]');
  await page.waitForURL("**/superadmin");

  const table = page.locator('[data-testid="superadmin-users"]');
  await expect(table).toContainText(E2E.email);
  await expect(table).toContainText("outsider@testforge.local");

  // 4. Every header sorts. Asserting on the *relative* order of the two known
  //    fixtures keeps this honest however many other accounts the run left
  //    behind: "E2E User" < "Outsider" alphabetically, so flipping the User
  //    column has to swap them.
  const rowOrder = async () => {
    const emails = await table.locator("tbody tr td:first-child").allInnerTexts();
    const at = (needle: string) => emails.findIndex((t) => t.includes(needle));
    return { e2e: at(E2E.email), outsider: at("outsider@testforge.local") };
  };

  await page.click('[data-testid="superadmin-sort-user"]');
  await page.waitForURL("**/superadmin?sort=user&dir=asc");
  const asc = await rowOrder();
  expect(asc.e2e).toBeLessThan(asc.outsider);

  await page.click('[data-testid="superadmin-sort-user"]');
  await page.waitForURL("**/superadmin?sort=user&dir=desc");
  const desc = await rowOrder();
  expect(desc.e2e).toBeGreaterThan(desc.outsider);

  // "Last action" is the one column ordered by a SQL aggregate rather than a
  // User field — worth proving it renders at all.
  await page.click('[data-testid="superadmin-sort-last"]');
  await page.waitForURL("**/superadmin?sort=last&dir=desc");
  await expect(table).toContainText(E2E.email);

  await page.goto("/superadmin");

  // 5. Search narrows to one row.
  await page.fill('[data-testid="superadmin-search"]', "outsider");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/superadmin?q=outsider*");
  await expect(table).toContainText("outsider@testforge.local");
  await expect(table).not.toContainText(E2E.email);

  // 6. CSV export is served to the operator session.
  const csv = await page.request.get("/superadmin/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("outsider@testforge.local");

  // 7. Sign out kills the cookie — and the export with it.
  await page.goto("/superadmin");
  await page.click('[data-testid="superadmin-logout"]');
  await page.waitForURL("**/superadmin/login");
  expect((await page.request.get("/superadmin/export")).status()).toBe(401);
});

test(`TC-${TC}-82 Instance console: an ordinary app session is not an operator`, async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // A logged-in org ADMIN is still not the instance operator.
  await page.goto("/superadmin");
  await page.waitForURL("**/superadmin/login");
  expect((await page.request.get("/superadmin/export")).status()).toBe(401);
});

test(`TC-${TC}-144 Instance console: the Projects column counts work, not Academy sandboxes`, async ({
  page,
}) => {
  // A-04 gives the sandbox its own `Project.kind` so the surfaces that list "my
  // projects" can filter it out. This column was the one that never did, which
  // made it read one project too high for anybody who had opened a single
  // hands-on lesson — in the one place an operator uses to tell an active
  // account from a dormant one.
  const stamp = Date.now();
  const email = `superadmin-sandbox-${stamp}@testforge.local`;
  const user = await db.user.create({
    data: {
      name: `Sandbox Counter ${stamp}`,
      email,
      passwordHash: await bcrypt.hash("SandboxCount123", 10),
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });

  const projectsCell = async () => {
    await page.goto(`/superadmin?q=${encodeURIComponent(email)}`);
    const row = page.locator('[data-testid="superadmin-users"] tbody tr').first();
    await expect(row).toContainText(email);
    return (await row.locator("td").nth(3).innerText()).trim();
  };

  const csvCount = async () => {
    const csv = await (await page.request.get("/superadmin/export")).text();
    const line = csv.split("\n").find((l) => l.includes(email)) ?? "";
    // id,name,email,role,organization,organization_slug,projects,...
    return line.split(",")[6];
  };

  await operatorLogin(page);
  expect(await projectsCell()).toBe("0");

  // A sandbox is a real project with a real OWNER membership — that is what
  // made it countable in the first place, and nothing here fakes it.
  const sandbox = await db.project.create({
    data: {
      name: "Academy Sandbox",
      slug: `academy-count-${stamp}`,
      kind: "ACADEMY_SANDBOX",
      createdById: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  expect(await projectsCell()).toBe("0");
  expect(await csvCount()).toBe("0");

  // A real project does count, so the filter is not simply hiding the column.
  const real = await db.project.create({
    data: {
      name: "Real Work",
      slug: `real-count-${stamp}`,
      createdById: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  expect(await projectsCell()).toBe("1");
  expect(await csvCount()).toBe("1");

  // Sorting has to agree with the number it sorts on, and proving that needs a
  // pair the two orderings disagree about *deterministically*. One sandbox per
  // user — what the app actually provisions — cannot produce one: a sandbox
  // adds exactly 1, so the worst an unfiltered sort does is tie n-real-plus-a-
  // sandbox against (n+1)-real, and a tie resolves on `u."id"`, which would make
  // this assertion a coin flip rather than a guard.
  //
  // So the decoy carries three sandbox rows. That is not a state the product
  // creates, and it does not need to be: what is under test is whether `kind`
  // is honoured when ordering, not how many sandboxes provisioning hands out.
  // Three rather than two because the neighbour totals 2 unfiltered — its own
  // sandbox plus its real project — and two would only tie with it. The decoy
  // displays 0 and totals 3; the neighbour displays 1 and totals 2. A filtered
  // sort puts the neighbour first, an unfiltered one puts the decoy first, and
  // neither outcome is left to a tiebreak.
  const decoyEmail = `sbxsort-decoy-${stamp}@testforge.local`;
  const decoy = await db.user.create({
    data: {
      name: `Sandbox Decoy ${stamp}`,
      email: decoyEmail,
      passwordHash: await bcrypt.hash("SandboxCount123", 10),
      emailVerifiedAt: new Date(),
    },
  });
  for (const n of [1, 2, 3]) {
    await db.project.create({
      data: {
        name: `Academy Sandbox ${n}`,
        slug: `academy-decoy-${n}-${stamp}`,
        kind: "ACADEMY_SANDBOX",
        createdById: decoy.id,
        members: { create: { userId: decoy.id, role: "OWNER" } },
      },
    });
  }

  // The search term matches both fixtures and nothing else, so the assertion is
  // about these two rows however many accounts the run has left behind — and it
  // exercises the filtered branch of the raw ordering while it is here.
  await page.goto(`/superadmin?q=${stamp}&sort=projects&dir=desc`);
  const rows = page.locator('[data-testid="superadmin-users"] tbody tr');
  await expect(rows).toHaveCount(2);
  const first = rows.nth(0);
  await expect(first).toContainText(email);
  await expect(first.locator("td").nth(3)).toHaveText("1");
  const second = rows.nth(1);
  await expect(second).toContainText(decoyEmail);
  await expect(second.locator("td").nth(3)).toHaveText("0");

  await db.project.deleteMany({ where: { createdById: decoy.id } });
  await db.user.delete({ where: { email: decoyEmail } });

  await db.project.delete({ where: { id: sandbox.id } });
  await db.project.delete({ where: { id: real.id } });
  await db.user.delete({ where: { email } });
});
