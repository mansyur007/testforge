# testforge-cli

Command-line uploader for [TestForge](https://github.com/mansyur007/test-forge),
a free, open-source test case management platform.

Wraps the TestForge REST API (`POST /api/v1/results`) so CI can push automation
results in a single command. Report format is auto-detected from the file
(JUnit, TRX, NUnit3, xUnit.net v2, Cucumber JSON, Mocha JSON), or forced with
`--format`.

## Install

```bash
npm install -g testforge-cli
# or run without installing:
npx testforge-cli upload results/junit.xml --project web
```

Requires Node.js 18+ (uses the built-in `fetch`).

## Usage

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
| `--url <url>` | TestForge base URL (or env `TESTFORGE_URL`) |
| `--token <token>` | WRITE-scoped API key (or env `TESTFORGE_TOKEN`) |

Create a WRITE-scoped API key in **Settings → API Keys**.

## Example

```bash
export TESTFORGE_URL=https://testforge.example.com
export TESTFORGE_TOKEN=tf_xxxxxxxx

testforge upload playwright-report/results.xml \
  --project web --name "CI #${GITHUB_RUN_NUMBER}" \
  --env staging --origin "GitHub Actions"
```

Tests are matched to cases by a `TC-<SLUG>-<n>` annotation in the test name
(e.g. `TC-WEB-001`), falling back to an exact title match.

## License

MIT
