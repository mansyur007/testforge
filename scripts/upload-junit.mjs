// Upload Playwright JUnit results to TestForge's /api/v1/junit endpoint.
// The dev server must be running. API key: TF_API_KEY env, or the local key
// minted by the e2e global setup (e2e-results/.api-key).
import fs from "node:fs";

const API = process.env.TF_API_URL ?? "http://localhost:3456";
const PROJECT = process.env.TF_PROJECT ?? "e2e";
const FILE = process.env.TF_JUNIT ?? "e2e-results/junit.xml";

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
const url = `${API}/api/v1/junit?project=${PROJECT}&name=${encodeURIComponent(name)}&source=playwright`;

const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/xml" },
  body: xml,
});
const data = await res.json().catch(() => ({}));
console.log(`HTTP ${res.status}`, JSON.stringify(data));
if (!res.ok) process.exit(1);
