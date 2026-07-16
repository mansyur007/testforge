import type { HelpTopic } from "./types";

export const automation: HelpTopic = {
  slug: "automation",
  title: "Automation & CI upload",
  summary: "Upload automated test results from CI and auto-match them to cases.",
  body: `
## Uploading results

Create an API key with write access under **Settings → API Keys**, then POST
your results file:

\`\`\`
curl -X POST "https://<your-instance>/api/v1/results?project=<slug>&name=<run name>" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/xml" \\
  --data-binary @results/junit.xml
\`\`\`

The format is auto-detected from the body — **JUnit XML, TRX (MSTest),
NUnit3, xUnit.net v2, Cucumber JSON, and Mocha JSON** are all supported. Pass
\`&format=trx\` (etc.) to be explicit instead of relying on detection.

## Matching tests to cases

Two ways a test result gets matched to a case:

1. **Annotation** — include \`TC-<PROJECT>-<n>\` in the test's name (e.g. a
   Playwright test titled \`"TC-WEB-12 login redirects to dashboard"\`).
2. **Exact title match** — if there's no annotation, the test name is compared
   against case titles directly.

Anything that matches neither is reported back as **unmatched** in the
response, but doesn't block the rest of the upload. A matched case
automatically flips to **Automated** in its automation-status field.

## Legacy endpoint

\`POST /api/v1/junit\` still works — it's the original JUnit-only endpoint,
kept as a permanent alias. New integrations should prefer \`/api/v1/results\`.

## CI quality gates

Configure a gate under **Fields → Quality Gate** (minimum pass rate, max new
failures vs the previous run, block-on-untested, required tags), then make CI
ask for the verdict with one call. The check exits non-zero when the gate
fails, so the pipeline stops:

\`\`\`yaml
- name: TestForge quality gate
  run: npx testforge-cli gate --project web --run latest --wait 600
  env:
    TESTFORGE_URL: \${{ vars.TESTFORGE_URL }}
    TESTFORGE_TOKEN: \${{ secrets.TESTFORGE_TOKEN }}
\`\`\`

\`--wait 600\` polls until the run completes (up to 10 minutes) before
judging it. The same verdict is available raw at
\`GET /api/v1/projects/<slug>/gate?run=latest\` — a read-scoped API key is
enough. "New failures" means a case that passed in the previous completed run
of the same source and fails now — the same definition the run-compare page
uses, with muted cases excluded.

Full request/response schema: [API reference](/docs/api).
`,
};
