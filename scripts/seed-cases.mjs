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
// Each carries real steps/preconditions/expected so the manual case mirrors the
// automated test (the JUnit upload only records pass/fail, it never authors these).
const CASES = [
  {
    title: "Valid login redirects to dashboard",
    preconditions: "A verified account exists.",
    steps: [
      { action: "Open /login", expected: "Login form is shown" },
      { action: "Enter a valid email and password", expected: "" },
      { action: "Click Log In", expected: "" },
    ],
    expected_result: "User is redirected to /dashboard.",
    priority: "HIGH",
    tags: "smoke,login",
  },
  {
    title: "Language switcher on login",
    preconditions: "On the /login page.",
    steps: [{ action: "Observe the language control", expected: "EN and ID buttons are visible" }],
    expected_result: "An EN/ID language switcher is present and toggles the language.",
    priority: "LOW",
    tags: "i18n",
  },
  {
    title: "Change password succeeds",
    preconditions: "Logged in with an email/password account.",
    steps: [
      { action: "Open Settings → Account", expected: "" },
      { action: "Enter current password, new password, and confirm", expected: "" },
      { action: "Click Change password", expected: "" },
    ],
    expected_result: "A 'Password changed successfully.' message is shown.",
    priority: "MEDIUM",
    tags: "account",
  },
  {
    title: "Dashboard renders in English",
    preconditions: "Logged in.",
    steps: [{ action: "Open /dashboard", expected: "Nav and labels are in English" }],
    expected_result: "Sidebar (Projects, Account) and stat labels (Active Projects) are English.",
    priority: "LOW",
    tags: "i18n",
  },
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

for (const c of CASES) {
  const res = await fetch(`${API}/api/v1/projects/${PROJECT}/cases`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: c.title,
      preconditions: c.preconditions,
      steps: c.steps,
      expectedResult: c.expected_result,
      priority: c.priority,
      type: "FUNCTIONAL",
      tags: c.tags,
    }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`${res.status} ${data.displayId ?? data.error ?? ""} — ${c.title}`);
  if (!res.ok) process.exit(1);
}
console.log("Done. Now run the suite and upload with the same TF_* env vars.");
