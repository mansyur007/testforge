import type { Lesson } from "../../types";

export const httpAndDevtools: Lesson = {
  slug: "http-and-devtools",
  title: "HTTP and browser dev tools for testers",
  summary:
    "Status codes, headers, the network tab, and reading a failed request like a developer.",
  minutes: 12,
  status: "draft",
  body: `
## The page is a rumour; the network tab is the evidence

Everything you have tested so far, you tested by looking at a screen. The screen
is a *rendering* of what the server said, filtered through a pile of JavaScript
that can lose, reorder, cache or invent things on the way.

So a bug report that says "the order didn't save" is a report about the screen.
The developer's first question will be some version of *"did the request go
out?"*, and there are three completely different bugs hiding behind that one
sentence:

- the request was never sent — a front-end bug, in the button
- the request was sent and the server rejected it — check the status and the
  response body
- the request succeeded and the screen did not update — a front-end bug, in the
  rendering

Open the network tab and you know which of the three you have, in about eight
seconds. That single distinction is most of what this lesson is for: it moves
you from *reporting a symptom* to *reporting a location*, and it is the fastest
credibility upgrade available to a manual tester.

## The status code, in the amount of detail you actually need

Codes come in families, and the family is the part that matters:

| Family | Means | Whose problem |
|---|---|---|
| **2xx** | It worked | — |
| **3xx** | Look somewhere else | Usually fine; watch for loops |
| **4xx** | **You** sent something wrong | The client, or the rules |
| **5xx** | **The server** broke | Always a defect |

The one rule worth memorising: **a 5xx is always a bug.** Not "the server was
busy", not "you sent bad data" — if bad input can make a server return 500, the
bug is that it did not return 400. File it every time.

The codes you will actually meet:

| Code | Meaning | The tester's note |
|---|---|---|
| 200 | OK | Check the *body*; a 200 can carry \`{"error": "..."}\` |
| 201 | Created | What a successful POST should return |
| 204 | No content | Normal for DELETE |
| 301 / 302 | Moved / found | 301 is permanent and gets cached — expensive to get wrong |
| 400 | Bad request | Your input broke a rule |
| 401 | **Unauthenticated** | The server does not know who you are |
| 403 | **Forbidden** | It knows who you are; you are not allowed |
| 404 | Not found | Or: found, but hidden from you on purpose |
| 409 | Conflict | Duplicate, or someone edited it first |
| 422 | Unprocessable | Well-formed, but semantically invalid |
| 429 | Too many requests | Rate limited — *is* there a limit? Test it |
| 500 | Server error | A defect. Always |
| 502 / 503 / 504 | Gateway / unavailable / timeout | Infrastructure, still worth reporting |

**401 versus 403 is the pair that catches people**, and it is worth being precise
because the difference is a real class of security defect. 401 says *I do not
know who you are*; 403 says *I know exactly who you are and the answer is no*. If
a permission test returns 401 when you are demonstrably logged in, something has
dropped your session. If it returns 404 where you expected 403, that may be
deliberate — hiding the existence of a resource from someone who cannot see it is
a legitimate design — but it should be a decision, so ask.

## What to look at in the network tab

Open dev tools (F12), pick **Network**, tick **Preserve log** — without it, a
redirect after submit wipes the request you were trying to read, which is the
single most common way people lose the evidence they came for. Then do the
action.

Four things, in this order:

1. **Method and URL.** Did the request happen at all, and did it go where you
   expected? A POST to the wrong URL and no request at all look identical
   on-screen.
2. **Status.** Filter to \`Fetch/XHR\` to see the app's own calls without the
   images and fonts.
3. **Payload / Request body.** *What did the browser actually send?* This is
   where you find that the field you typed into is not in the request, or is
   there twice, or is sending an empty string where you expected null.
4. **Response.** The raw truth, before any rendering. A validation message that
   never appears on screen is usually already sitting here.

Two more tabs that pay for themselves:

- **Timing** — a request taking 4 seconds is a finding even when it succeeds.
- **Headers** — where cache and security behaviour lives, below.

## Headers worth a tester's attention

You do not need to know all of them. You need these:

- **\`Content-Type\`** — \`application/json\` vs \`text/html\`. A JSON API returning
  HTML on error is why an app sometimes shows a raw stack trace.
- **\`Cache-Control\`** — the header behind "it still shows the old price". If a
  page with personal data is cacheable, that is a defect worth escalating.
- **\`Set-Cookie\`** — check \`HttpOnly\`, \`Secure\` and \`SameSite\` on the session
  cookie. A session cookie without \`HttpOnly\` is readable by any script on the
  page. This is a ten-second check and it is a real finding.
- **\`Location\`** — where a 3xx is sending you.
- **\`Retry-After\`** — what a 429 or 503 says about when to come back.

## Reading a failure properly

Half of what a developer does with a bug report is reconstruct what you saw.
Doing that work yourself changes what happens to the report.

A worked example on ShopMini. You apply the discount code \`SAVE10\` at checkout
and the screen shows a generic *"Something went wrong"*. What is in the network
tab:

~~~
POST /api/checkout/discount            500  1.2s
  Request:  {"code":"SAVE10 ","orderId":"ord_8831"}
  Response: {"error":"Internal server error","traceId":"a41f-9c02"}
~~~

Three findings, not one, and they are three different defects:

1. **The 500 itself.** A trailing space is user input; user input must not reach
   an unhandled exception. The correct response is 400 with a message.
2. **The client sent \`"SAVE10 "\` with the space.** The field is not trimming
   before submit, and the rule says letters and digits only. That is a separate
   front-end defect and it is the *trigger*.
3. **The user saw "Something went wrong".** Even if the server is at fault, the
   UI has no specific message for this path. Support will get a ticket nobody
   can act on.

And the report now carries a **traceId**, which lets a developer find the
server-side stack trace in seconds instead of trying to reproduce your afternoon.
Copy trace and correlation ids into every report — it is free and it changes
how fast things get fixed.

> **Copy as cURL.** Right-click any request in the network tab → *Copy* → *Copy
> as cURL*. Paste that into your bug report and the developer has your exact
> request — headers, cookies, body — reproducible without you. It is the single
> highest-value dev-tools feature for a tester and almost nobody uses it.

## The console, briefly

Switch to **Console** and look for red. Uncaught errors there often explain a
screen that simply did nothing: the request succeeded, the rendering code threw,
and the UI froze mid-update. That is exactly the third bug in this lesson's
opening list, and the console is where it announces itself.

Filter out the noise from extensions and third-party scripts before you report
anything — a browser extension's error in your console is not the product's
defect.

## Three checks you can run on anything, today

1. **Submit a form and watch the request.** Does the payload contain what you
   typed? Whitespace, case, and empty-vs-null are all visible here and invisible
   on screen.
2. **Break a rule and read the response.** Send something invalid. A 400 with a
   clear message is good; a 500 is a defect; a 200 with an error inside the body
   is a design smell worth raising.
3. **Look at the session cookie once per product.** \`HttpOnly\`, \`Secure\`,
   \`SameSite\`. Ten seconds, and it is the kind of finding that makes people
   start inviting you to design reviews.

## Where TestForge fits

A case whose expected result is "an error is shown" can pass while the server is
returning 500 — the screen did show an error, after all. Write the observable
fact instead: *"the API returns 400 with a message naming the field; the form
shows that message inline."* Then paste the failing request's **Copy as cURL**
into the defect, along with the status, the response body and any trace id.

That defect is reproducible by someone who was not there, which is the only
property that really matters.

**Next:** cutting the browser out of the loop entirely and testing the API
directly — where all of this stops being something you observe and becomes
something you drive.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A user reports that saving a profile does nothing — no error, no change. You reproduce it. What single observation splits this into the smallest number of distinct causes?",
      choices: [
        {
          id: "a",
          text: "Whether the browser console shows a red error",
        },
        {
          id: "b",
          text: "Whether a request was sent at all, and if so what status it returned",
          correct: true,
        },
        {
          id: "c",
          text: "Whether the same thing happens in a different browser",
        },
        {
          id: "d",
          text: "Whether the user's session is still valid",
        },
      ],
      explanation:
        "\"Nothing happened\" hides three different bugs — the request was never sent, the server rejected it, or it succeeded and the screen failed to update — and the network tab separates all three in one look. The console is useful but only catches the third case, and only when the failure was a thrown error. Another browser and the session state are both worth checking later; neither narrows the location of the fault the way the request itself does.",
    },
    {
      id: "q2",
      stem: "Submitting a discount code with a trailing space returns 500. The developer says the code is invalid anyway, so the error is expected. What is the correct position?",
      choices: [
        {
          id: "a",
          text: "Agree — invalid input producing an error response is working as intended",
        },
        {
          id: "b",
          text: "A 500 on user input is a defect regardless; an invalid code should return 400 with a message",
          correct: true,
        },
        {
          id: "c",
          text: "Only report it if a real user would plausibly type a trailing space",
        },
        {
          id: "d",
          text: "Report it as a front-end defect, since the field should have trimmed the input",
        },
      ],
      explanation:
        "The rejection is correct; the way it was delivered is not. 5xx means the server hit something it did not handle, and user input reaching an unhandled exception is a defect on its own — the fix is a 400 that names the problem. Whether a real user would type it is not the test: the input arrived over a public endpoint, so anything can send it. The untrimmed field is also a genuine defect, but it is the trigger, not the reason the server fell over.",
    },
    {
      id: "q3",
      stem: "Which observations from the network tab are findings worth reporting even when the feature appears to work on screen?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "A successful request that consistently takes 4 seconds",
          correct: true,
        },
        {
          id: "b",
          text: "The session cookie is set without HttpOnly",
          correct: true,
        },
        {
          id: "c",
          text: "The response arrives as application/json",
        },
        {
          id: "d",
          text: "A 200 response whose body contains an error object",
          correct: true,
        },
      ],
      explanation:
        "Response time is part of the behaviour, not a separate concern, and four seconds is a finding whether or not the result is correct. A session cookie without HttpOnly is readable by any script on the page — a ten-second check with real security weight. A 200 carrying an error inside the body means every client has to parse success twice, and monitoring will report the endpoint as healthy while it fails. A JSON content type on a JSON API is simply the correct behaviour.",
    },
  ],
};
