import type { Lesson } from "../../types";

export const securityForTesters: Lesson = {
  slug: "security-for-testers",
  title: "Security testing for QA",
  summary:
    "The OWASP Top 10 through a tester's eyes, with checks you can run today.",
  minutes: 16,
  status: "published",
  body: `
## Read this part first

Everything in this lesson is for systems **you are authorised to test**. Before
any of it:

- **Written authorisation.** A verbal "sure, go ahead" is not it. Scope in
  writing, naming the environments.
- **Only the environments named**, never production unless it is explicitly in
  scope with a window and someone watching.
- **No third parties.** If your application talks to a payment provider, their
  systems are not in scope, ever.
- **No destructive payloads**, no real customer data, no denial of service.
- **On a real finding: stop, document, report through the security channel.** Do
  not keep digging to see how far it goes. Proving the door is unlocked is the
  job; walking through it and taking inventory is not.

T2's non-functional lesson set out these rules and they are not softer here.
A tester who probes access control without them is not being thorough, they are
being fired.

## Why testers find these bugs

You are not going to out-tool a penetration tester. What you have instead is
better than a tool: **you know what the application is supposed to do, and who is
supposed to be able to do it.**

Most of the highest-impact security defects are not exotic. They are business
logic and authorisation failures — a user reaching another user's data, a step
that can be skipped, a price that can be edited. Scanners are famously bad at
those, because a scanner does not know that project 7 belongs to someone else.
You do.

## Broken access control: start here, always

The most common serious class, and the one a tester is best placed to find. Three
checks, in order of yield:

**1. Change the id in the URL.**

~~~
/projects/108/settings     ← yours
/projects/109/settings     ← somebody else's
~~~

If that loads, you have found IDOR — insecure direct object reference — and it is
a serious defect. Sequential ids make it trivial to enumerate.

**2. Call the endpoint the UI hides.** This is the automation track's argument
made concrete: a hidden button is not a permission check.

~~~bash
curl -X DELETE https://app.example.com/api/v1/suites/s_123 \\
  -H "Authorization: Bearer $VIEWER_TOKEN"
~~~

A viewer token should get 403. If it gets 200, the permission exists only in the
interface.

**3. Change the role in the request, not the UI.** A signup or profile-update
payload that quietly accepts \`"role": "ADMIN"\` is privilege escalation, and it
happens more than you would like.

A useful matrix, filled in by *trying* rather than by reading the code:

| | Own record | Another user's | Another org's |
|---|---|---|---|
| Admin | ✓ | ? | **must be 403/404** |
| Member | ✓ | ? | **must be 403/404** |
| Viewer | read | ? | **must be 403/404** |
| Logged out | **must be 401** | **must be 401** | **must be 401** |

Every cell is a test. Most teams have never filled one in.

## The rest of the Top 10, as tester-sized checks

| Class | What to try | What you are looking for |
|---|---|---|
| **Injection** | \`' OR '1'='1\`, \`'; --\` in inputs, and in URL parameters | A database error, a changed result set, a stack trace |
| **XSS** | \`<script>alert(1)</script>\`, \`"><img src=x onerror=alert(1)>\` | Your input coming back **executed** rather than displayed |
| **Auth failures** | Old password after a change; session after logout; token after role change | A session that outlives the thing that authorised it |
| **Security misconfiguration** | \`/.env\`, \`/.git/config\`, \`/admin\`, default credentials | Anything reachable that should not be |
| **Sensitive data exposure** | Read the API response, not the screen | Password hashes, other users' emails, internal ids in a payload the UI never shows |
| **Insecure design** | Skip a step in a multi-step flow; replay a request | Business logic enforced only by the order the UI presents |

Two of those deserve more than a row.

**Sensitive data exposure is where the UI lies to you most.** A profile endpoint
that returns the whole user record and lets the front end render three fields is
leaking the rest to anyone who opens devtools. Read the response body, always —
this is the api-automation lesson's habit turned toward a different question.

**Insecure design is the one scanners cannot touch at all.** Add an item to a
cart, proceed to payment, and then change the quantity or the price in the
request. Skip from step 1 to step 4 of a wizard. Replay a "confirm order" request
twice. A checkout that validates the price only in the browser is a real and
recurring defect, and no tool will find it because nothing about it is malformed.

## Things worth checking that are not in the Top 10

- **Rate limiting.** Can you try 500 passwords? Request 1000 password resets?
- **Error messages that distinguish** "no such user" from "wrong password" — that
  is user enumeration, and the same 403-versus-404 argument the automation track
  made about not confirming a record exists.
- **File upload.** Does it accept a \`.php\` or \`.svg\`? Is it served back from the
  same domain? Is there a size limit?
- **Password reset tokens.** Single use? Expiring? Invalidated when the password
  changes?
- **Security headers**, quickly: \`Content-Security-Policy\`,
  \`Strict-Transport-Security\`, \`X-Content-Type-Options\`.

## Tools help, but they are the smaller half

**OWASP ZAP** in passive mode is the cheapest useful thing: proxy your normal
exploratory session through it and read what it noticed. **Dependency scanning**
— \`npm audit\`, Dependabot, Snyk — belongs in CI, because vulnerable dependencies
are the most common way an application inherits a defect nobody wrote.

But treat all scanner output as **findings to verify, not defects to file**.
False positives are the norm, and a QA who files thirty unverified scanner
tickets teaches the security team to ignore them.

## Reporting a security finding

Different from a normal bug report in three ways: **channel, detail, and blast
radius.**

- **Channel.** A security bug in a public tracker is a disclosure. Use whatever
  private route exists; if none exists, that is itself worth raising.
- **Detail.** Exact request, exact response, the account and role used, and the
  minimum steps. "Auth is broken" is not actionable.
- **Impact in plain terms.** "Any logged-in user can read any other
  organisation's test cases by changing the id in the URL. Confirmed on staging
  with two accounts." That sentence gets a fix scheduled today.

And say what you did **not** do: how far you stopped, what you did not access.
That reassures a security team that the finding is contained and demonstrates you
worked inside the rules.

## Where TestForge fits

The authorisation matrix above is a test suite, and it is one of the few security
areas that automates cleanly — the api-automation lesson's viewer-token example
is exactly this. Every cell is a request with an expected status code, they run
in milliseconds, and they never go stale the way manual checks do.

Writing them as cases with a \`security\` tag means the run history answers the
question an auditor eventually asks: *when did you last verify that a viewer
cannot delete a suite?* "Every build since March" is a much better answer than
"we tested it once".

**Next:** contract testing — catching integration breakage between services
without standing up a full end-to-end environment.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why are testers often better than scanners at finding the highest-impact security defects?",
      choices: [
        {
          id: "a",
          text: "Testers have deeper knowledge of exploit techniques than automated tools",
        },
        {
          id: "b",
          text: "The worst defects are usually authorisation and business logic failures, and a scanner does not know who should be allowed to do what",
          correct: true,
        },
        {
          id: "c",
          text: "Scanners cannot send authenticated requests",
        },
        {
          id: "d",
          text: "Scanners only check the front end, never the API",
        },
      ],
      explanation:
        "A scanner is looking for malformed things — injection strings, known-vulnerable versions, missing headers. It has no idea that project 109 belongs to a different organisation, that a wizard step should not be skippable, or that a price should not be editable in the request, because none of those are malformed. They are perfectly well-formed requests doing something the business never intended. The tester's advantage is domain knowledge: you know what the application is for and who is supposed to be able to do what, which is exactly what an authorisation matrix encodes. Scanners do authenticate and do test APIs — that is not the gap.",
    },
    {
      id: "q2",
      stem: "You change the id in a URL from /projects/108 to /projects/109 and another organisation's data loads. What should you do next?",
      choices: [
        {
          id: "a",
          text: "Enumerate further to establish how many records are exposed, so the report has full impact data",
        },
        {
          id: "b",
          text: "Stop, document the exact request and response, and report it through the private security channel",
          correct: true,
        },
        {
          id: "c",
          text: "File it in the public issue tracker so the team sees it quickly",
        },
        {
          id: "d",
          text: "Try the same id on production to confirm it is a real problem",
        },
      ],
      explanation:
        "Proving the door is unlocked is the job; walking through and taking inventory is not — continuing to enumerate means accessing more data you have no right to, and it can turn a clean finding into an incident involving you. The report needs the exact request, response, the accounts and roles used, and the impact in plain terms, which you already have from the one instance. The channel matters as much as the content: a security bug in a public tracker is a disclosure. And reaching for production takes you outside the authorised scope entirely, which is the one boundary that is never worth crossing to confirm something staging already showed you.",
    },
    {
      id: "q3",
      stem: "Which of these checks are things a QA is well placed to run without specialist tooling?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Calling a delete endpoint directly with a viewer's token to see whether it returns 403",
          correct: true,
        },
        {
          id: "b",
          text: "Reading an API response body for fields the UI never displays",
          correct: true,
        },
        {
          id: "c",
          text: "Changing the price or quantity in a checkout request after the cart step",
          correct: true,
        },
        {
          id: "d",
          text: "Running a load of 10,000 concurrent requests to see whether the login endpoint falls over",
        },
      ],
      explanation:
        "The first three are all business-logic and authorisation checks that need nothing but a browser's devtools or curl, and they are the classes scanners are worst at: permission enforced only in the UI, a response leaking fields the screen filters out, and a flow whose rules exist only in the order the interface presents them. The fourth is a denial-of-service attempt rather than a security check — it is explicitly excluded by the rules of engagement at the top of this lesson, and if you genuinely need to know how the system behaves under load, that is a performance test run in an agreed window against an agreed environment.",
    },
  ],
};
