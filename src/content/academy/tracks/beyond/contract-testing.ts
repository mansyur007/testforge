import type { Lesson } from "../../types";

export const contractTesting: Lesson = {
  slug: "contract-testing",
  title: "Contract testing",
  summary:
    "Catching integration breakage without a full end-to-end environment.",
  minutes: 13,
  status: "draft",
  body: `
## The gap this fills

The API automation lesson admitted a limit: an API test proves the provider
answers correctly, but it **cannot tell you the real client sends the request
your test constructs**. Your test hand-writes the payload. The application uses
its own client code. Those two drift apart quietly, and nothing in either suite
notices.

The usual answer is an integrated environment where every service runs at once
and end-to-end tests exercise the whole thing. It works, and it costs: the
environment is always partly broken, someone owns it full time, a failure takes
an afternoon to localise, and you cannot run it on a pull request because you
would need eleven services at the right versions.

Contract testing gets most of that confidence back without the environment. The
trade is real and worth stating early: **it verifies the interface, not the
feature.**

## What a contract actually is

Not the API documentation. Not the OpenAPI file, necessarily. A contract is
**one consumer's expectations of one provider**:

- the requests this consumer actually sends — path, method, headers, body shape
- the parts of the response this consumer actually reads

That second half is the part people get wrong. If the checkout service reads
\`id\` and \`total\` from the order response and ignores the other fourteen
fields, the contract covers \`id\` and \`total\`. The provider is free to change,
add or remove everything else without breaking this consumer — and a contract
that claims otherwise turns every provider change into a false alarm.

## Consumer-driven, in two halves that never meet

The mechanism that makes this work without a shared environment: **the two sides
are tested at different times, in different pipelines.**

~~~
Consumer CI                            Provider CI
-----------                            -----------
run consumer tests
  against a mock provider
        │
        ▼
  produces a pact file  ──▶  broker  ──▶  provider replays every
  (the recorded contract)                  recorded interaction
                                           against a real provider
                                                  │
                                                  ▼
                                           pass/fail published back
~~~

The consumer's own tests generate the contract as a by-product of running
against a mock. The provider then replays those recorded interactions against
itself. Neither run needs the other side to be up.

**A consumer test with Pact, in outline:**

~~~js
// consumer side — orders-client.pact.test.js
await provider.addInteraction({
  state: "an order 42 exists",
  uponReceiving: "a request for order 42",
  withRequest: {
    method: "GET",
    path: "/api/v1/orders/42",
    headers: { Authorization: like("Bearer token") },
  },
  willRespondWith: {
    status: 200,
    body: {
      id: like(42),
      total: like(19.99),
      currency: term({ generate: "USD", matcher: "^[A-Z]{3}$" }),
    },
  },
});

// the assertion that matters: the REAL client, not a hand-written fetch
const order = await ordersClient.fetchOrder(42);
expect(order.total).toBe(19.99);
~~~

The last two lines are the whole point. If you call \`fetch()\` directly in the
test, you have tested your test. Drive the actual client module the application
ships, and the contract records what the application really sends.

## Matchers, and the mistake everyone makes first

\`like(42)\` says *a number goes here*, not *the number 42*. \`term()\` says
*a string matching this pattern*.

Write \`total: 19.99\` as a literal and you have told the provider that its test
data must contain an order totalling exactly 19.99 forever. That contract fails
the first time someone reseeds a database, and after two or three of those the
team turns the verification job off. **Assert on shape and type; assert on
values only when the value itself is the agreement** — a currency code, an enum,
a status string the consumer branches on.

## Provider states are the other half

\`state: "an order 42 exists"\` is a named hook the provider implements: before
replaying that interaction, put yourself in this state. It is the seam that lets
the provider control its own data, which is what keeps the contract from being
coupled to a fixture.

Keep states few and coarse — "an order exists", "no orders exist", "the user is
unauthorised". A codebase with sixty provider states has moved its test data
problem, not solved it.

## Contract tests do not replace anything

| Question | Answered by |
|---|---|
| Does the provider send back the shape my client expects? | Contract test |
| Does the provider calculate the total correctly? | Provider's own unit/API tests |
| Does the checkout flow work for a person? | A small number of E2E tests |

A contract test that asserts business rules is a badly-placed provider test: it
runs in the wrong pipeline, it is slower to debug, and it breaks for the wrong
team. The rule is the pyramid argument from \`what-to-automate\` applied to
integration — **each test at the layer that can answer it.**

## The cheaper option, and when it is enough

Consumer-driven contracts need a broker, two pipelines wired together, and a
versioning discipline. That is real setup cost, and it buys the most when
**several consumers you do not control depend on one provider.**

If there is one consumer and one provider and the same team owns both, a
**schema check is usually enough**: keep an OpenAPI spec, validate real
responses against it in the provider's CI, and generate the consumer's client
from it. You lose the "which consumer breaks" precision and keep most of the
protection against accidental shape changes, for a fraction of the machinery.

Be honest about which situation you are in. A broker installed for a two-service
system is a maintenance burden dressed up as rigour.

## Deploying on the result

The payoff is a question CI can answer before a release: *has every consumer's
contract been verified against the version I am about to ship?* Pact calls it
\`can-i-deploy\`, and it turns the broker into a deployment gate rather than a
report nobody reads.

~~~bash
pact-broker can-i-deploy \\
  --pacticipant orders-api --version "$GIT_SHA" \\
  --to-environment production
~~~

Without a gate like that, contract results are advisory, and advisory results
decay.

## Where TestForge fits

Pact's verification step emits JUnit XML like any other runner, so the provider
job uploads it through \`/api/v1/junit\` exactly as the T3 capstone did — same
endpoint, same matching rules, one case per interaction.

Tagged \`contract\`, those cases answer a question that only run history can:
**were integration breakages caught before deploy or after?** A month of
verification runs going red on the provider's branch and green on main is the
evidence that the gate is doing its job. One passing run proves almost nothing
here.

**Next:** observability and testing in production — what to do about the failures
that only exist where the real users are.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "In a consumer-driven contract test, why must the test call the application's real client module rather than constructing the HTTP request by hand?",
      choices: [
        {
          id: "a",
          text: "Hand-written requests are slower to execute in the mock provider",
        },
        {
          id: "b",
          text: "The contract is meant to record what the application actually sends, and a hand-written request only records what the test author imagined it sends",
          correct: true,
        },
        {
          id: "c",
          text: "Pact cannot record an interaction unless it comes from a generated client",
        },
        {
          id: "d",
          text: "Because the provider needs the client's source code to verify the contract",
        },
      ],
      explanation:
        "This is the specific gap contract testing exists to close — the API automation lesson named it: an API test proves the provider responds correctly, but the request in that test was written by hand, so it cannot prove the shipped client sends the same thing. Driving the real client module through the mock provider makes the recorded pact a description of production behaviour rather than of the test. Bypass it with a raw fetch and the contract will happily stay green while the client sends a header the provider stopped accepting. Pact will record whatever request reaches its mock, generated client or not, and the provider verifies against the pact file alone — it never sees the consumer's code.",
    },
    {
      id: "q2",
      stem: "A consumer's contract asserts `total: 19.99` as a literal value. What is the most likely consequence?",
      choices: [
        {
          id: "a",
          text: "The provider's verification breaks whenever its test data changes, and the team eventually stops trusting the job",
          correct: true,
        },
        {
          id: "b",
          text: "The consumer will fail to parse a total of any other value at runtime",
        },
        {
          id: "c",
          text: "The contract file grows too large to publish to the broker",
        },
        {
          id: "d",
          text: "The provider is forced to return a float rather than a string, which is correct behaviour",
        },
      ],
      explanation:
        "A literal value in a contract is an instruction to the provider that its data must contain that exact number forever, so the next reseed turns a healthy provider red. Two or three of those and the verification job gets marked non-blocking, which costs you the entire protection. Matchers exist for this: `like(19.99)` asserts a number goes here, and values are asserted only when the value is the agreement itself — a currency code, an enum, a status the consumer branches on. Nothing about the literal changes runtime parsing, file size, or the wire type the provider chooses.",
    },
    {
      id: "q3",
      stem: "Which of these belong in a contract test rather than somewhere else?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "That the order response contains an `id` field of type number, which the consumer reads",
          correct: true,
        },
        {
          id: "b",
          text: "That the `currency` field is always a three-letter uppercase code the consumer branches on",
          correct: true,
        },
        {
          id: "c",
          text: "That the order total equals the sum of its line items minus the discount",
        },
        {
          id: "d",
          text: "That a customer can complete checkout with a saved card",
        },
      ],
      explanation:
        "A contract covers the shape of what one consumer sends and the parts of the response it actually reads — a field's presence and type, and a value's format when the consumer depends on that format. The totalling rule is provider business logic: it belongs in the provider's own unit or API tests, where a failure names the right team and debugs in seconds. The checkout journey is a user-facing question no interface-level check can answer, which is what the small number of surviving end-to-end tests are for. Putting either into a contract test is the pyramid mistake repeated at the integration layer: the test runs in the wrong pipeline and breaks for the wrong people.",
    },
  ],
};
