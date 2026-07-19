# testforge-cli

Command-line uploader for [TestForge](https://github.com/mansyur007/testforge),
a free, open-source test case management platform.

Three commands for CI and for keeping test cases in git:

- **`upload`** — push automation results (JUnit, TRX, NUnit3, xUnit.net v2,
  Cucumber JSON, Mocha JSON; auto-detected or forced with `--format`).
- **`gate`** — ask the project's quality gate for a verdict and exit non-zero
  when it fails.
- **`cases`** — two-way sync between a folder of YAML files and TestForge.

## Install

```bash
npm install -g testforge-cli
# or run without installing:
npx testforge-cli upload results/junit.xml --project web
```

Requires Node.js 18+ (uses the built-in `fetch`).

Every command reads `TESTFORGE_URL` and `TESTFORGE_TOKEN` from the
environment (or `--url` / `--token`). Create an API key in
**Settings → API Keys** — `upload`, `push` need WRITE scope; `gate`, `pull`,
`status` only need READ.

## `upload` — automation results

```bash
testforge upload <file> --project <slug> [options]
```

| Option | Description |
| --- | --- |
| `--project <slug>` | TestForge project slug (**required**) |
| `--name <run>` | Name for the created run (default: `CLI Run <timestamp>`) |
| `--format <fmt>` | `junit`\|`trx`\|`nunit3`\|`xunit2`\|`cucumber`\|`mocha` (default: auto-detect) |
| `--env <name>` | Environment tag; auto-created if missing |
| `--origin <text>` | Free-text origin label, e.g. `"CI · GitHub Actions"` |

```bash
export TESTFORGE_URL=https://testforge.example.com
export TESTFORGE_TOKEN=tf_xxxxxxxx

testforge upload playwright-report/results.xml \
  --project web --name "CI #${GITHUB_RUN_NUMBER}" \
  --env staging --origin "GitHub Actions"
```

Tests are matched to cases by a `TC-<SLUG>-<n>` annotation in the test name
(e.g. `TC-WEB-001`), falling back to an exact title match.

## `gate` — CI quality gates

Configure the policy in **Fields → Quality Gate** (min pass rate, max new
failures vs the previous run, block-on-untested, required tags), then let CI
enforce it. **Exits 0 only if the gate passes** — any failure, or an error
reaching the server, exits 1 so a broken gate blocks rather than waves through.

```bash
testforge gate --project web --run latest --wait 600
```

| Option | Description |
| --- | --- |
| `--run <id\|latest>` | Run to judge (default: `latest`) |
| `--wait <seconds>` | Poll until the run completes, up to N seconds (default: 0) |

## `cases` — test cases as code

Sync a `tests/` folder of canonical YAML with the server so cases are reviewed
in pull requests like code. A committed `.testforge.lock` holds the base state
for 3-way merging; conflicting edits **exit 1 with a report** rather than
silently overwriting.

```bash
testforge cases pull --project web      # server → files
testforge cases status --project web    # what changed where
testforge cases push --project web      # files → server
```

| Option | Description |
| --- | --- |
| `--dir <path>` | Case-file directory (default: `tests/`) |
| `--force-local` | `push`: your files win a conflict |
| `--force-server` | `pull`/`push`: the server wins (discards local edits) |

Full schema and merge semantics:
[docs/CASES-AS-CODE.md](https://github.com/mansyur007/testforge/blob/main/docs/CASES-AS-CODE.md).

## License

MIT
