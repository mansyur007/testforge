// Create the matching test cases in a TestForge project (prod or local) via the
// REST API, so JUnit uploads map to TC-<SLUG>-1..N. Run once against a fresh
// project; skips if the project already has cases.
//
//   TF_API_URL=https://testforge.emha.space TF_PROJECT=e2e TF_API_KEY=tf_xxx \
//     node scripts/seed-cases.mjs
import process from "node:process";

const API = process.env.TF_API_URL ?? "http://localhost:3456";
const PROJECT = process.env.TF_PROJECT ?? "e2e";
const KEY = process.env.TF_API_KEY;

if (!KEY) {
  console.error("Set TF_API_KEY (Settings → API Keys on the target instance).");
  process.exit(1);
}

// Order matters: these become seq 1..4 → TC-<SLUG>-1..4, matching the spec names.
const TITLES = [
  "Valid login redirects to dashboard",
  "Language switcher on login",
  "Change password succeeds",
  "Dashboard renders in English",
];

const headers = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const list = await fetch(`${API}/api/v1/projects/${PROJECT}/cases`, { headers });
if (!list.ok) {
  console.error(`Cannot read project "${PROJECT}" (HTTP ${list.status}). Check the slug, the key, and that the key's user is a member of the project.`);
  process.exit(1);
}
const existing = await list.json();
if ((existing.items?.length ?? 0) > 0) {
  console.log(`Project "${PROJECT}" already has ${existing.items.length} case(s) — skipping seed.`);
  process.exit(0);
}

for (const title of TITLES) {
  const res = await fetch(`${API}/api/v1/projects/${PROJECT}/cases`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, priority: "MEDIUM", type: "FUNCTIONAL" }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`${res.status} ${data.displayId ?? data.error ?? ""} — ${title}`);
  if (!res.ok) process.exit(1);
}
console.log("Done. Now run the suite and upload with the same TF_* env vars.");
