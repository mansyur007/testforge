import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { E2E } from "./global-setup";

// F-12: exercise the testforge-cli `upload` and the shared reporter client via
// subprocesses (the packages are standalone ESM; running them under node keeps
// their nested package.json "type":"module" honoured, unlike importing them
// into this CJS-transformed spec).
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const BASE = "http://localhost:3456";
const ROOT = path.join(__dirname, "..");

function apiKey(): string {
  return fs
    .readFileSync(path.join(ROOT, "e2e-results", ".api-key"), "utf8")
    .trim();
}

function runNode(args: string[], input?: string): string {
  return execFileSync("node", args, {
    cwd: ROOT,
    env: { ...process.env, TESTFORGE_URL: BASE, TESTFORGE_TOKEN: apiKey() },
    encoding: "utf8",
    input,
  });
}

test(`TC-${TC}-45 CLI upload: matches a TC-id junit into a run`, async () => {
  const junit = path.join(os.tmpdir(), `tf-cli-${Date.now()}.xml`);
  fs.writeFileSync(
    junit,
    `<testsuites><testsuite name="s" tests="1"><testcase name="TC-E2E-001 login" time="0.5"/></testsuite></testsuites>`
  );
  try {
    const out = runNode([
      "packages/cli/bin/testforge.js",
      "upload",
      junit,
      "--project",
      E2E.projectSlug,
      "--name",
      `CLI e2e ${Date.now()}`,
    ]);
    expect(out).toMatch(/uploaded/);
    expect(out).toMatch(/matched 1 result/);
  } finally {
    fs.rmSync(junit, { force: true });
  }
});

test(`TC-${TC}-46 Reporter client: create run → stream result → complete`, async ({
  request,
}) => {
  // Drive the shared client (used by the Playwright & Cypress reporters) in a
  // child node process; it prints the run id it created.
  const script = `
    import { TestForgeClient } from "./packages/playwright-reporter/lib/client.js";
    const c = new TestForgeClient({ url: process.env.TESTFORGE_URL, token: process.env.TESTFORGE_TOKEN, project: "${E2E.projectSlug}" });
    await c.loadCaseMap();
    const caseId = c.resolveCaseId("TC-E2E-001 in a test title");
    if (!caseId) { console.error("no-case"); process.exit(2); }
    const runId = await c.createRun({ name: "Reporter client " + Date.now(), source: "PLAYWRIGHT", origin: "e2e" });
    await c.postResult({ caseId, status: "PASSED", elapsedSeconds: 1 });
    await c.completeRun();
    process.stdout.write(runId);
  `;
  const runId = runNode(["--input-type=module", "-"], script).trim();
  expect(runId).toBeTruthy();

  const res = await request.get(
    `/api/v1/projects/${E2E.projectSlug}/runs/${runId}/results`,
    { headers: { Authorization: `Bearer ${apiKey()}` } }
  );
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.data).toHaveLength(1);
  expect(body.data[0].status).toBe("PASSED");
});
