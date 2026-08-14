import type { Lesson } from "../../types";

export const nonFunctionalBasics: Lesson = {
  slug: "non-functional-basics",
  title: "Non-functional testing you can do today",
  summary:
    "Cheap first checks for performance, security and reliability.",
  minutes: 12,
  status: "draft",
  body: `
## "Does it work" is one question out of many

Everything up to here has asked whether the software does the right thing.
Non-functional testing asks **how well** it does it: fast enough, safe enough,
under enough load, recovering from enough failures, usable by enough people. The
standard vocabulary for these lives in ISO 25010 — performance efficiency,
security, reliability, usability, compatibility, maintainability, portability —
and the previous two lessons were already two of them.

Two things go wrong with this whole area in practice:

1. **Nobody wrote a requirement.** So there is nothing to test against, so it
   gets skipped, so the first measurement of your page's speed is a customer
   complaining.
2. **"Non-functional means specialist tools, so it is not my job."** Load
   generators and scanners are indeed a specialism, and you will meet them in the
   senior track. But the *embarrassing* non-functional defects — the eight-second
   page, the URL that shows you another customer's order, the double charge on a
   flaky connection — are all findable with dev tools, a second browser profile
   and half an hour.

This lesson is that half hour.

## Performance: answer the single-user question first

Three separate questions get called "performance", and confusing them is why
teams skip all three:

| Question | Needs | Who |
|---|---|---|
| Is it fast for **one** user? | Dev tools | **You, today** |
| Does it stay fast with **a lot of data**? | Test data | **You, today** |
| Does it stay fast under **many users**? | k6, JMeter | A load test — senior track |

The third one is the one people mean, and the first two are where most of the
findings actually are.

**The single-user pass.** Open the network tab (the dev-tools lesson's habits all
apply) and load the page cold:

- **Total time, total transferred, request count.** A number you can compare
  release to release, once you write down the conditions.
- **The slowest request.** One 3-second API call is a finding on its own,
  regardless of what the page total says.
- **The waterfall's shape.** Requests in a diagonal staircase are *serial* —
  each waiting for the one before. That is a design defect and it is visible
  without knowing anything about the code.
- **The largest response.** A 4MB hero image on a mobile checkout is a bug with a
  price attached.
- **Request count against row count.** 20 rows and 23 requests is fine; 20 rows
  and 220 requests is the N+1 pattern, and it will be catastrophic at 200 rows.
- **Throttle it.** Slow-network and 4× CPU throttling in dev tools turn "feels
  fine on my laptop" into what a mid-range phone experiences.

**The data-volume pass**, which almost nobody runs: everything is fast with the
twelve rows in the demo fixture. Create the account with 10,000 orders, the
project with 5,000 cases, the 300-character customer name, the 40MB attachment,
the report over three years. Search boxes, sorting, exports and any screen with a
total on it are where this bites — and the failure mode is usually not slowness
but a timeout at some threshold nobody knew existed.

> **A number without conditions and a target is an opinion.** *"The page is
> slow"* invites a shrug. *"Search takes 6.2s at 10k cases, cold cache, throttled
> to 4G, median of three runs — target is under 2s"* is a defect. If there is no
> target, **propose one in the ticket**: a proposed budget somebody has to argue
> down is how non-functional requirements actually get written in most teams.

## Security: the part a manual tester should own

You are not a penetration tester, and this is not that lesson. But **broken
access control** has sat at or near the top of the OWASP Top Ten for years, it is
the class of flaw automated scanners are worst at, and finding it needs exactly
what you already have: two accounts and the ability to read a URL.

**1. Authorization by URL — the highest-yield check on this list.** Log in as user
A, open something of A's, copy the URL or note the id. Log out, log in as user B
in a separate browser profile, paste it. You should get 403 or 404. If you get
A's data, that is a serious defect, and it is what a hidden menu item looks like
from the outside. Run the same check against the API with B's token — a UI that
hides the button while the endpoint answers anyone is the same bug one layer down.

**2. Force-browse.** Type \`/admin\` as an ordinary user. Not rendering a link is
not access control. Try the other methods too: a resource you cannot \`GET\` but
can \`DELETE\` is a real and common asymmetry.

**3. Session lifecycle.** After logging out, does the old session actually die —
re-send a captured request with the old cookie and see. Does changing the
password end other sessions? Is there an idle timeout at all?

**4. Password reset.** Use the emailed link twice. Use it after an hour. Request
one for another account and check whose session you end up in.

**5. Client-side-only validation.** The form caps quantity at 10; send 10,000 to
the API. The form disables the submit button; the endpoint may not care. Worst
case in this family: a total or a price sent *from* the client and trusted.

**6. Leaked information.** Stack traces in a 500 response, a debug or metrics
endpoint answering anonymously, sequential ids that let you enumerate customers,
and login or reset flows that distinguish *"no such email"* from *"wrong
password"* and hand an attacker a user list.

**7. Transport and cookies.** HTTPS everywhere including redirects, \`HttpOnly\`,
\`Secure\` and \`SameSite\` on the session cookie, and no tokens or personal data in
query strings — those end up in server logs, browser history and \`Referer\`
headers.

> **Rules of engagement, and these are not negotiable.** Test only systems you
> are **authorized in writing** to test, only in the environments that
> authorization names, and never against third parties in the flow — payment
> providers, identity providers, a CDN — who have not agreed to anything. No
> destructive payloads and no real customer data. And when you find something
> real: **stop, document, and report it through your organisation's security
> channel** — not in a group chat, not in a public ticket, and do not keep digging
> to see how far it goes. Confirming a door is unlocked is the finding. Walking
> through it is somebody else's decision to authorise.

## Reliability: attack the happy path's assumptions

Every flow you have tested so far assumed the network works, the user clicks once
and nothing interrupts. Remove those assumptions one at a time — this is the
cheapest source of high-severity defects in the whole lesson:

- **Kill the network mid-submit.** Dev tools → offline, then submit. Does the UI
  say something true, and — the important half — *did the write land anyway?* Go
  and ask the database.
- **Double-submit.** Double-click the button, or tap twice on a slow connection.
  Two orders is the classic, and you already know the query that finds it.
- **Refresh and back.** Reload mid-wizard, use the back button after a successful
  submit, resubmit the form. Duplicated records and "confirm resubmission"
  dialogs both live here.
- **Expire the session** with the form open, then submit. Losing an hour of typing
  to a redirect is a defect, not a security feature.
- **Time it out.** Make the server slow (throttle) and see whether the client
  retries — and whether retrying is *safe*. A retry on a non-idempotent payment
  is a double charge.
- **Two tabs, one record.** Edit the same thing in both and save in sequence.
  Silent last-write-wins is a lost-update defect, and it is invisible to anyone
  testing in one window.
- **Odd input.** 500 characters, emoji, right-to-left text, a leading zero,
  negative, zero, a 40MB file. Not to be clever — these are what real users paste.

## Turning any of this into something that gets fixed

Same discipline for all three areas: **the measurement, the conditions, the
target, the impact.** One line of consequence in money or user terms beats a
paragraph of mechanism. *"Search over 6s for any account past ~8k cases; that is
our top 40 customers"* is a sentence a product owner can act on.

For security findings, add severity and use the channel. For performance, attach
the waterfall screenshot. For reliability, say exactly which assumption you
removed — *"submitted with the network disabled"* — because that is the step
people fail to reproduce.

## Where TestForge fits

Make an **NFR suite** that runs once per release against your critical flows:
the seven security checks, the single-user timings, the volume pass, and the
reliability list above. They are slow-changing and easy to forget, which is
precisely what a saved suite is for.

Put the *number* in the run result rather than only pass or fail — 6.2s, 4MB,
220 requests — and the run history becomes a performance trend you did not have
to build any tooling for. Tag them \`perf\`, \`sec\` and \`robustness\` so each is
selectable on its own.

And note what a target does to a defect: a report that carries a measurement and
a budget has its own acceptance criterion, so it can be **verified fixed** rather
than argued about twice.

**Next:** all of this has produced numbers. The next lesson is about which numbers
mean anything — pass-rate theatre, escape rate, and what belongs on a dashboard
somebody outside the team will read.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "You have two test accounts, a browser, and thirty minutes. Which check has historically the highest chance of finding a serious security defect?",
      choices: [
        {
          id: "a",
          text: "Trying SQL injection strings in every text field on the site",
        },
        {
          id: "b",
          text: "Opening user A's resource URL — and the same API request — while authenticated as user B",
          correct: true,
        },
        {
          id: "c",
          text: "Checking that the login page is served over HTTPS with a valid certificate",
        },
        {
          id: "d",
          text: "Submitting a very long string to see whether the server returns a 500",
        },
      ],
      explanation:
        "Broken access control has sat at or near the top of the OWASP Top Ten for years, it is the class automated scanners are worst at, and testing it needs nothing but two accounts and a copied URL — including against the API, because a hidden button and a protected endpoint are different things. Injection strings and oversized inputs are worth trying and do find bugs, but modern frameworks parameterise queries by default, so the yield per hour is much lower. The HTTPS check is a ten-second look worth doing and almost always already correct. Note the boundary in all four: this is authorized testing on a system you have permission to test, and a real finding goes to the security channel rather than into further poking.",
    },
    {
      id: "q2",
      stem: "You report that a search screen \"is slow\". The reply is that it seems fine to the developer. What was missing from the report?",
      choices: [
        {
          id: "a",
          text: "A profiler trace showing which function is responsible",
        },
        {
          id: "b",
          text: "The measurement with its conditions — data volume, network, cache, median of several runs — and the target it fails",
          correct: true,
        },
        {
          id: "c",
          text: "Confirmation that it is also slow for other users, making it reproducible",
        },
        {
          id: "d",
          text: "A load test showing the behaviour under concurrent users",
        },
      ],
      explanation:
        "\"Slow\" is a judgement, and the developer's laptop with twelve rows of fixture data is genuinely fast, so both of you are reporting honestly about different situations. A number plus the conditions that produced it makes the two comparable, and a target — asked for, or proposed in the ticket if none exists — is what makes exceeding it a defect rather than an impression. A profiler trace is the developer's job once they accept the finding. Other users would help, but the conditions are what let anyone reproduce it deliberately. And load testing answers a different question entirely: this one fails for a single user.",
    },
    {
      id: "q3",
      stem: "Which of these reliability checks can a manual tester run today, with dev tools and no specialist tooling?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Submitting a form with the network switched to offline, then checking whether the write landed anyway",
          correct: true,
        },
        {
          id: "b",
          text: "Double-clicking a submit button on a throttled connection to look for duplicate records",
          correct: true,
        },
        {
          id: "c",
          text: "Editing the same record in two tabs and saving in sequence to see whether one update is silently lost",
          correct: true,
        },
        {
          id: "d",
          text: "Establishing the response time at 500 concurrent users to find where throughput collapses",
        },
      ],
      explanation:
        "The first three are dev-tools-and-patience work: offline mode, a throttled connection and a second tab, each removing one assumption the happy path was built on — and each finding a high-severity class of defect, since the offline case tells you whether the UI and the stored data agree, and the two-tab case is a lost update nobody testing in one window can see. Concurrency at 500 users is the exception: it needs a load generator and a target environment that can absorb it, which is a load test with its own planning, and it belongs to the senior track rather than to this pass.",
    },
  ],
};
