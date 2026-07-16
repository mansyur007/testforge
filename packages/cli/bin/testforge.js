#!/usr/bin/env node
// testforge-cli: upload automation results to a TestForge instance.
// Wraps the F-11 batch endpoint POST /api/v1/results — format is auto-detected
// server-side (junit/trx/nunit3/xunit2/cucumber/mocha) or forced with --format.
//
// Config: env TESTFORGE_URL + TESTFORGE_TOKEN, or --url/--token flags.

import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const VERSION = "0.1.0";

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      // --key=value or --key value
      if (key.includes("=")) {
        const [k, ...v] = key.split("=");
        flags[k] = v.join("=");
      } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = true;
      }
    } else positional.push(a);
  }
  return { positional, flags };
}

const USAGE = `testforge ${VERSION}

Usage:
  testforge upload <file> --project <slug> [options]
  testforge gate --project <slug> [--run <id|latest>] [--wait <seconds>]
  testforge cases pull|status|push --project <slug> [--dir tests/]

Options:
  --project <slug>   TestForge project slug (required)
  --name <run>       Name for the created run (default: "CLI Run <timestamp>")
  --format <fmt>     junit|trx|nunit3|xunit2|cucumber|mocha (default: auto-detect)
  --env <name>       Environment tag; auto-created if it doesn't exist
  --origin <text>    Free-text origin label (e.g. "CI · GitHub Actions")
  --run <id|latest>  Run to gate (default: latest)
  --wait <seconds>   Poll until the run completes, up to N seconds (default: 0)
  --dir <path>       Case-file directory for \`cases\` (default: tests/)
  --force-local      cases push: your files win a conflict
  --force-server     cases pull/push: the server wins (discards local edits)
  --url <url>        TestForge base URL   (or env TESTFORGE_URL)
  --token <token>    API key (or env TESTFORGE_TOKEN; gate needs read scope)
  -h, --help         Show this help
  -v, --version      Print version

Examples:
  TESTFORGE_URL=https://testforge.example.com TESTFORGE_TOKEN=tf_xxx \\
    testforge upload results/junit.xml --project web --name "CI #42"
  testforge gate --project web --run latest --wait 600
  testforge cases pull --project web && testforge cases status --project web
`;

function fail(msg) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(1);
}

async function cmdUpload(positional, flags) {
  const file = positional[0];
  if (!file) fail("missing <file>. See `testforge upload --help`.");

  const url = (flags.url || process.env.TESTFORGE_URL || "").replace(/\/$/, "");
  const token = flags.token || process.env.TESTFORGE_TOKEN || "";
  if (!url) fail("no TestForge URL. Pass --url or set TESTFORGE_URL.");
  if (!token) fail("no API token. Pass --token or set TESTFORGE_TOKEN.");
  const project = flags.project;
  if (!project) fail("--project <slug> is required.");

  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (e) {
    fail(`cannot read ${file}: ${e.message}`);
  }

  const name = flags.name || `CLI Run ${new Date().toISOString()}`;
  const qs = new URLSearchParams({ project, name });
  if (flags.format) qs.set("format", String(flags.format));
  if (flags.env) qs.set("env", String(flags.env));
  if (flags.origin) qs.set("origin", String(flags.origin));

  // Content-Type is a hint; the server sniffs the body regardless. Send the
  // right one so proxies don't mangle it.
  const contentType = raw.trimStart().startsWith("<")
    ? "application/xml"
    : "application/json";

  let res;
  try {
    res = await fetch(`${url}/api/v1/results?${qs}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: raw,
    });
  } catch (e) {
    fail(`request failed: ${e.message}`);
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      payload?.error?.message || payload?.error || `HTTP ${res.status}`;
    fail(`upload rejected: ${detail}`);
  }

  const runUrl = payload.runUrl ? `${url}${payload.runUrl}` : "(unknown)";
  process.stdout.write(
    `✓ uploaded ${basename(file)} — matched ${payload.matched ?? "?"} result(s)` +
      (payload.unmatched?.length
        ? `, ${payload.unmatched.length} unmatched`
        : "") +
      `\n  run: ${runUrl}\n`
  );
}

// L-02: fetch the gate verdict, optionally waiting for the run to complete,
// and exit 0 iff it passes. Any HTTP/parse error exits 1 — a broken gate
// must block, not wave through. No color codes (CI logs).
async function cmdGate(flags) {
  const url = (flags.url || process.env.TESTFORGE_URL || "").replace(/\/$/, "");
  const token = flags.token || process.env.TESTFORGE_TOKEN || "";
  if (!url) fail("no TestForge URL. Pass --url or set TESTFORGE_URL.");
  if (!token) fail("no API token. Pass --token or set TESTFORGE_TOKEN.");
  const project = flags.project;
  if (!project) fail("--project <slug> is required.");
  const run = String(flags.run || "latest");
  const waitSeconds = Number(flags.wait || 0);

  const endpoint = `${url}/api/v1/projects/${project}/gate?run=${encodeURIComponent(run)}`;
  const fetchVerdict = async () => {
    let res;
    try {
      res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      fail(`request failed: ${e.message}`);
    }
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload) {
      const detail =
        payload?.error?.message || payload?.error || `HTTP ${res.status}`;
      fail(`gate check failed: ${detail}`);
    }
    return payload;
  };

  let verdict = await fetchVerdict();
  const deadline = Date.now() + waitSeconds * 1000;
  while (verdict.run.status !== "COMPLETED" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    verdict = await fetchVerdict();
  }
  if (waitSeconds > 0 && verdict.run.status !== "COMPLETED") {
    process.stdout.write(
      `gate: timed out after ${waitSeconds}s waiting for run to complete\n`
    );
    process.exit(1);
  }

  const rows = [
    ["CHECK", "EXPECTED", "ACTUAL", "RESULT"],
    ...verdict.checks.map((c) => [
      c.name,
      c.expected,
      c.actual,
      c.pass ? "OK" : "FAIL",
    ]),
  ];
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => String(r[i]).length))
  );
  for (const r of rows)
    process.stdout.write(
      r.map((cell, i) => String(cell).padEnd(widths[i])).join("  ") + "\n"
    );
  process.stdout.write(`gate: ${verdict.pass ? "PASS" : "FAIL"}\n`);
  process.exit(verdict.pass ? 0 : 1);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.version || flags.v) return process.stdout.write(`${VERSION}\n`);
  const cmd = positional.shift();
  if (!cmd || flags.help || flags.h || cmd === "help")
    return process.stdout.write(USAGE);

  if (cmd === "upload") return cmdUpload(positional, flags);
  if (cmd === "gate") return cmdGate(flags);
  // L-03: lazy import — `cases` is the only command needing the `yaml` dep,
  // so upload/gate keep working even if it somehow failed to install.
  if (cmd === "cases") {
    const { cmdCases } = await import("./cases.js");
    return cmdCases(positional, flags);
  }
  fail(`unknown command "${cmd}". See \`testforge --help\`.`);
}

main();
