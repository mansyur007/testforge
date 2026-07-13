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

Options:
  --project <slug>   TestForge project slug (required)
  --name <run>       Name for the created run (default: "CLI Run <timestamp>")
  --format <fmt>     junit|trx|nunit3|xunit2|cucumber|mocha (default: auto-detect)
  --env <name>       Environment tag; auto-created if it doesn't exist
  --origin <text>    Free-text origin label (e.g. "CI · GitHub Actions")
  --url <url>        TestForge base URL   (or env TESTFORGE_URL)
  --token <token>    WRITE-scoped API key (or env TESTFORGE_TOKEN)
  -h, --help         Show this help
  -v, --version      Print version

Examples:
  TESTFORGE_URL=https://testforge.example.com TESTFORGE_TOKEN=tf_xxx \\
    testforge upload results/junit.xml --project web --name "CI #42"
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

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.version || flags.v) return process.stdout.write(`${VERSION}\n`);
  const cmd = positional.shift();
  if (!cmd || flags.help || flags.h || cmd === "help")
    return process.stdout.write(USAGE);

  if (cmd === "upload") return cmdUpload(positional, flags);
  if (cmd === "gate")
    fail("`gate` requires CI quality gates (L-02), not yet released.");
  fail(`unknown command "${cmd}". See \`testforge --help\`.`);
}

main();
