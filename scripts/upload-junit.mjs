// Upload Playwright JUnit results to TestForge's /api/v1/junit endpoint.
// The dev server must be running. API key: TF_API_KEY env, or the local key
// minted by the e2e global setup (e2e-results/.api-key).
import fs from "node:fs";
import os from "node:os";

const API = process.env.TF_API_URL ?? "http://localhost:3456";
const PROJECT = process.env.TF_PROJECT ?? "e2e";
const FILE = process.env.TF_JUNIT ?? "e2e-results/junit.xml";

// Auto-detect where this run came from so the report shows it — no user action.
// Override explicitly with TF_RUN_LABEL (e.g. "VPS") when needed.
function detectOrigin() {
  if (process.env.TF_RUN_LABEL) return process.env.TF_RUN_LABEL;
  if (process.env.GITHUB_ACTIONS) {
    return `CI · GitHub Actions (${process.env.RUNNER_OS ?? "Linux"})`;
  }
  if (process.env.CI) return "CI";
  const plat =
    { darwin: "macOS", linux: "Linux", win32: "Windows" }[process.platform] ??
    process.platform;
  return `Local · ${plat} (${os.hostname()})`;
}
const ORIGIN = detectOrigin();

const KEY =
  process.env.TF_API_KEY ||
  (fs.existsSync("e2e-results/.api-key")
    ? fs.readFileSync("e2e-results/.api-key", "utf8").trim()
    : null);

if (!KEY) {
  console.error(
    "No API key. Set TF_API_KEY (create one in Settings → API Keys) or run the e2e suite first to mint a local key."
  );
  process.exit(1);
}
if (!fs.existsSync(FILE)) {
  console.error(`JUnit file not found: ${FILE}. Run \`npm run e2e\` first.`);
  process.exit(1);
}

const xml = fs.readFileSync(FILE, "utf8");
const name = `Playwright ${new Date().toISOString()}`;
const url = `${API}/api/v1/junit?project=${PROJECT}&name=${encodeURIComponent(name)}&source=playwright&origin=${encodeURIComponent(ORIGIN)}`;

const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/xml" },
  body: xml,
});
const data = await res.json().catch(() => ({}));

const slug = PROJECT.toUpperCase();
const listUnmatched = (items) => {
  for (const n of items) console.log(`    · ${n}`);
  console.log(
    `  Tip: match by giving the case the same title, or a TC-${slug}-<n> id in the test name.`
  );
};

if (!res.ok) {
  console.error(
    `\n✗ Upload failed — HTTP ${res.status}${data.error ? `: ${data.error}` : ""}`
  );
  if (Array.isArray(data.unmatched) && data.unmatched.length) {
    console.error(
      `\n  ${data.unmatched.length} test(s) matched no case in project "${PROJECT}":`
    );
    listUnmatched(data.unmatched);
  }
  process.exit(1);
}

const s = data.summary ?? {};
const total = (s.passed ?? 0) + (s.failed ?? 0) + (s.skipped ?? 0);
const fullRunUrl = data.runUrl ? `${API}${data.runUrl}` : null;

console.log(`\n✓ Uploaded to TestForge — project "${PROJECT}"`);
console.log(`  Origin:    ${ORIGIN}`);
if (fullRunUrl) console.log(`  Run:       ${fullRunUrl}`);
console.log(
  `  Results:   ${s.passed ?? 0} passed · ${s.failed ?? 0} failed · ${s.skipped ?? 0} skipped  (${total} total)`
);
console.log(`  Matched:   ${data.matched ?? 0} case(s)`);

const unmatched = Array.isArray(data.unmatched) ? data.unmatched : [];
if (unmatched.length) {
  console.log(
    `  Unmatched: ${unmatched.length} test(s) — not recorded against any case:`
  );
  listUnmatched(unmatched);
} else {
  console.log(`  Unmatched: none — every test mapped to a case.`);
}
