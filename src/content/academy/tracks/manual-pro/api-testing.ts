import type { Lesson } from "../../types";

export const apiTesting: Lesson = {
  slug: "api-testing",
  title: "API testing with Postman",
  summary:
    "Requests, environments, chaining, assertions, and testing the API a UI hides.",
  minutes: 15,
  status: "draft",
  sandbox: true,
  body: `
## Why test the layer under the screen

The UI is one client of the API. There are usually others — a mobile app, a
partner integration, a CI script — and they do not get the UI's validation. So
the interesting question is not "does the form work?" but **"what happens when
the rules are not enforced by the form?"**

Three things you can only do properly at this level:

- **Send what the UI cannot.** The quantity field caps at 99 because of an
  attribute in the HTML. What does the server do with 5000? With \`-1\`? With
  \`"abc"\`? If the answer is "accepts it", you have found a real defect that no
  amount of clicking would ever produce.
- **Test authorisation directly.** Take a request that works as an admin and
  replay it with a viewer's token. The UI hides the button; hiding a button is
  not a permission check. This is the single highest-value API test a manual
  tester runs, and it finds real bugs in most products.
- **Get there earlier and faster.** The API usually exists before the screen
  does, so testing can start a week sooner — and a 200-request run takes seconds
  where clicking takes a morning.

## The anatomy of a request, in the four parts you set

Whatever tool you use, you are filling in the same four things:

| Part | What it is | Where the bugs are |
|---|---|---|
| **Method + URL** | \`POST /api/v1/projects/demo/cases\` | Wrong verb on the wrong resource |
| **Headers** | \`Authorization\`, \`Content-Type\` | Missing or malformed auth |
| **Body** | JSON payload | Types, nulls, missing required fields |
| **Params** | \`?status=OPEN&limit=50\` | Filters that silently do nothing |

That last row is worth pausing on. **A query parameter the server does not
recognise is usually ignored in silence.** \`?stattus=OPEN\` returns 200 and every
row, and it looks exactly like a working filter. Always test a filter by
checking that it *excludes* something — a filter that returns results proves
nothing.

## Postman in the four features that matter

You can do all of this with \`curl\`, and eventually you will. Postman earns its
place for the middle two below.

**1. Collections.** A folder of saved requests, ordered so they can run top to
bottom. This is the artefact — it is your test suite for the API, it lives in
version control as an exported JSON file, and it can be run in CI.

**2. Environments.** Variables like \`{{baseUrl}}\` and \`{{token}}\`, swapped as a
set. One collection then runs against local, staging and production without
editing a single request.

> **Put the token in the environment, never in the request.** A collection with
> a hard-coded credential is one export away from being in a repo. This is the
> most common way testers leak secrets, and it is entirely avoidable — keep the
> secret in the environment, and do not commit the environment file.

**3. Chaining.** A test that means anything usually needs more than one request:
create something, then act on it. Postman scripts let one request hand a value
to the next.

~~~js
// In "Create case" → Scripts → Post-response
const body = pm.response.json();
pm.collectionVariables.set("caseId", body.id);
~~~

The next request uses \`{{caseId}}\` in its URL. Now the collection is a *flow*,
not a pile of requests — and the flow is the thing that finds real bugs, because
bugs live in the state that builds up between calls.

**4. Assertions.** A request whose result you eyeball is a demo. Add checks and
it becomes a test:

~~~js
pm.test("201 Created", () => pm.response.to.have.status(201));

pm.test("returns the case it created", () => {
  const b = pm.response.json();
  pm.expect(b.title).to.eql("Cart — quantity 100 is rejected");
  pm.expect(b.id).to.be.a("string");
});

pm.test("responds within 1s", () => pm.expect(pm.response.responseTime).to.be.below(1000));
~~~

Assert on **what the response says**, not just its status. A 200 that returns
the wrong object is the failure mode a status-only check is blind to, and it is
common.

## What to actually test, once you can send anything

Work through this list against any endpoint and you will have covered more than
most API test suites do:

| Category | The requests |
|---|---|
| **Happy path** | Valid input; check status, body shape, and the values you sent |
| **Validation** | Missing required field, wrong type (\`"5"\` vs \`5\`), null, empty string, oversized string |
| **Boundaries** | The same values your BVA lesson taught — 0, 1, 99, 100 |
| **Auth** | No token, expired token, malformed token, **another user's token** |
| **Authorisation** | A viewer calling a writer's endpoint; user A reading user B's resource by id |
| **Not found** | A well-formed id that does not exist; someone else's real id |
| **Idempotency** | Send the same POST twice — two orders, or one? |
| **Method** | \`DELETE\` on a read-only route; expect 405, not 500 |

Two of those find the most, in practice.

**User A reading user B's resource** — take a working request, change the id to
one belonging to another account, and send it with your own token. If you get
200, that is a serious defect, and it has a name: insecure direct object
reference. It takes fifteen seconds to test and products ship with it constantly.

**Sending the same POST twice** — double-submit is a real user behaviour (an
impatient click, a flaky network retry) and duplicate orders are expensive. The
API is where you can test it deterministically instead of trying to click fast
enough.

## The trap: testing the API only through what the UI sends

The comfortable way to build a collection is to open dev tools, copy the
requests the app makes, and save them. That is a good start and a bad finish,
because those requests are exactly the ones the UI already constrains — you have
rebuilt the front end's happy path in a slower tool.

The value is in the requests the UI *cannot* make. After you copy a request,
your first three edits should be: **remove a required field**, **change the
token**, and **put an out-of-range value in a field the form restricts.**

## Where TestForge fits

TestForge has a real REST API, and your sandbox is a real project — so you can
practise on a live system you are allowed to break. Create an API key under
**Settings → API Keys**, then:

~~~
GET  /api/v1/openapi                          the full schema, machine-readable
GET  /api/v1/projects/<slug>/cases            list your sandbox's cases
POST /api/v1/projects/<slug>/cases            create one
Header: Authorization: Bearer <API_KEY>
~~~

Start from \`/api/v1/openapi\` rather than guessing endpoints: it lists every
route, its parameters and its response shapes, and reading a spec before writing
requests is the habit that separates an hour of work from an afternoon of 404s.

Note the two key scopes — a read-only key that can POST is a defect, and testing
that is itself a good exercise.

**Next:** the other half of verification — going behind the API to the database,
so you can prove what was actually stored rather than what the response claimed.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "You take a working API request and re-send it unchanged except for swapping the resource id to one that belongs to another user's account, still using your own valid token. The server returns 200 with that user's data. What have you found?",
      choices: [
        {
          id: "a",
          text: "Nothing — your token was valid, so the request was legitimately authenticated",
        },
        {
          id: "b",
          text: "A serious authorisation defect: the endpoint authenticates but never checks ownership",
          correct: true,
        },
        {
          id: "c",
          text: "A UI defect, since the interface should not expose other users' ids",
        },
        {
          id: "d",
          text: "A test-data problem — the two accounts should not share an environment",
        },
      ],
      explanation:
        "Authentication and authorisation are separate checks, and this endpoint is doing the first and skipping the second: it confirmed who you are and then never asked whether you are allowed this particular record. Ids are frequently guessable or visible elsewhere, so \"the UI does not show them\" protects nothing. The test is deliberately run with two real accounts — that is the setup working, not a data problem.",
    },
    {
      id: "q2",
      stem: "A colleague builds the API collection by copying every request the web app makes from the network tab and saving it. Why is this a weak API test suite?",
      choices: [
        {
          id: "a",
          text: "Copied requests contain session cookies that expire, so the collection breaks",
        },
        {
          id: "b",
          text: "It only contains requests the UI already constrains — the value is in the ones the UI cannot send",
          correct: true,
        },
        {
          id: "c",
          text: "Requests copied from the browser cannot be parameterised with environment variables",
        },
        {
          id: "d",
          text: "It duplicates coverage that the UI tests already provide, so it adds no new assertions",
        },
      ],
      explanation:
        "Every copied request has already passed the front end's own validation, so the collection reproduces the happy path in a slower tool. What the API layer is uniquely good for is everything the form prevents: a missing required field, a value beyond the input's range, another user's token. Expiring credentials and parameterisation are both solvable and not the problem, and the suite is not merely redundant — run against a second client such as a mobile app or an integration, the same endpoints face inputs the web UI would never produce.",
    },
    {
      id: "q3",
      stem: "Which of these belong in a collection's environment rather than in the requests themselves?",
      multi: true,
      choices: [
        { id: "a", text: "The API key or bearer token", correct: true },
        {
          id: "b",
          text: "The base URL, so one collection runs against local, staging and production",
          correct: true,
        },
        {
          id: "c",
          text: "The assertion that a create call returns 201",
        },
        {
          id: "d",
          text: "The id of a seeded account the collection logs in as",
          correct: true,
        },
      ],
      explanation:
        "Anything that changes between environments — the host, the credentials, the seeded fixtures — belongs in the environment, which is what lets a single collection run anywhere. Keeping the token there in particular is what stops an exported collection from carrying a live secret into a repository. The 201 assertion is different in kind: it is the behaviour being tested and should hold in every environment, so it belongs to the request.",
    },
  ],
};
