import type { Lesson } from "../../types";

export const crossBrowserMobile: Lesson = {
  slug: "cross-browser-mobile",
  title: "Cross-browser and mobile testing",
  summary:
    "Building a device matrix from analytics instead of superstition.",
  minutes: 11,
  status: "draft",
  body: `
## Nobody tests "all browsers"

Count the combinations honestly. Five browsers, two versions each, four operating
systems, three viewport widths: that is 120 configurations, and you have until
Thursday. There is no version of this job where you cover them all.

So compatibility testing is not a coverage problem, it is a **selection**
problem. The whole skill is choosing the ten configurations that carry your
users, saying out loud which ones you are not covering, and getting somebody to
agree to that — the same move as the risk lesson, applied to environments
instead of features.

The wrong way to choose is the common one: test the browsers your team happens to
have open. That is how a bug reaches 12% of your customers and nobody sees it
for a month.

## Build the matrix from your own numbers

Not from global market share. Your users are not the world's users — a
government portal, a Brazilian shopping app and an internal HR tool have almost
nothing in common browser-wise, and the published charts describe none of them.

Where the real numbers live:

- **Product analytics** — GA4, Plausible, Matomo: browser, version, OS, device,
  viewport, by session. This is the primary source.
- **Server logs** — the \`User-Agent\` header on real requests, useful when
  analytics is blocked by ad blockers (which skews *toward* under-counting
  privacy-conscious desktop users).
- **Support tickets and reviews** — where the tail announces itself.
- **Revenue, not just sessions.** Sort the same table by orders. If 18% of
  sessions are Safari on iPhone but 31% of checkouts are, Safari is not a
  tier-two browser no matter what the session count says.

Then cut it into tiers, because "in the matrix" is not one thing:

| Tier | What it means | When |
|---|---|---|
| **1** | Full functional pass | Every release |
| **2** | Smoke: render, input, submit, pay | Every release |
| **3** | Best effort; fix real complaints | On report |
| **Out** | Explicitly unsupported, with a message | Documented, agreed |

Cover to roughly **95% of weighted sessions** in tiers 1 and 2, and write the
remaining 5% down. A matrix without an "Out" row is not a decision, it is a
wish — and the tail is where you would otherwise spend half your week.

> **Re-derive it quarterly.** Browser share moves, your customers change, and a
> device matrix from two years ago is superstition in a spreadsheet. The version
> rows especially: "current and previous major" ages by itself every six weeks.

## Engines, not brands

This is the fact that shrinks the matrix, and most testers learn it late:

| Engine | Browsers |
|---|---|
| **Blink** (Chromium) | Chrome, Edge, Opera, Brave, Samsung Internet |
| **Gecko** | Firefox |
| **WebKit** | Safari — **and every browser on an iPhone** |

Rendering, CSS support and JavaScript behaviour come from the engine. So Chrome
and Edge disagree about almost nothing that matters to you, and testing both as
tier 1 is a column you are paying for twice.

The consequence people get wrong: **Chrome on an iPhone is not Chrome.** It is
Safari's engine wearing Chrome's interface, so a bug you "reproduced in Chrome on
iOS" is a WebKit bug, and a page that works in desktop Chrome tells you nothing
about it. (The EU's Digital Markets Act has forced Apple to permit other engines
on iOS; in practice, treat WebKit as what your iOS users are running unless you
have measured otherwise.)

Which gives you three engine columns to cover rather than eight brands — and
makes **Safari on a real iPhone non-optional** if you have iOS users at all,
because it is the one engine no amount of desktop testing reaches.

## What actually breaks differently

Not your business logic. That runs on the server, and it does not care what
drew the page. What differs is everything at the edges:

| Area | The symptom you will see |
|---|---|
| **Form controls** | Date, time and \`file\` inputs are drawn by the browser and OS — a picker that works everywhere else refuses a keyboard entry on one |
| **Text and fonts** | A different fallback font is 8% wider, so the label wraps and pushes the button out of a fixed-height card |
| **Layout** | Sticky headers, \`overflow\` on scroll containers, and anything with a fixed height are the usual suspects |
| **Viewport units** | \`100vh\` is taller than the visible area on mobile, because the URL bar hides and reappears — the classic "submit button under the fold that nobody can reach" |
| **Storage** | Safari evicts script-written \`localStorage\` and IndexedDB after about a week without interaction; "it forgot my draft" is a real defect on one engine only |
| **Autoplay, clipboard, downloads** | Permission-gated differently per browser; a "copy link" button that silently does nothing on one |
| **Print / PDF** | Everyone forgets it, and invoices are printed |

Two habits that come from this list: when a layout bug appears in exactly one
browser, look for a **fixed dimension** nearby; when a *feature* fails in exactly
one browser, look for a **permission or a storage rule**.

## Mobile is not a narrow desktop

Resizing your desktop window to 375px finds layout bugs. It finds none of these,
and these are the ones that lose orders:

- **No hover.** A menu that opens on hover is unreachable by a thumb. Same for a
  tooltip carrying information that exists nowhere else.
- **The keyboard covers the thing you need.** The field is fine; the *submit
  button* is behind the on-screen keyboard, and the page will not scroll to it.
- **Rotation mid-flow.** Turn the phone at step 3 of 4. Half-filled forms that
  remount lose their state, and this is entirely invisible in a device emulator.
- **Interruptions.** A call, a notification, or switching apps and coming back
  four minutes later — during payment. Does the app resume, or start again, or
  charge twice?
- **Gestures the OS owns.** Pull-to-refresh on a submitted form, and the
  swipe-back gesture as a *navigation event you did not design for*.
- **Safe areas.** Notches, rounded corners and the home indicator eat the top and
  bottom of a full-bleed layout.
- **System text scaling.** A user at 200% font size is a supported user. Most
  fixed-height components fail immediately.
- **Real networks.** Not "slow": *variable*, with 40 seconds of nothing followed
  by everything at once. Throttle to a slow profile and watch what a
  double-tapped submit does.

Each of those is a test idea you can run today, on one borrowed phone.

## Emulator, simulator, real device

They answer different questions, and knowing which is which stops a lot of
wasted time:

| Tool | Real engine? | Finds | Misses |
|---|---|---|---|
| **Dev-tools device mode** | No — your desktop engine | Layout, breakpoints, touch targets | Every engine bug, every OS behaviour |
| **iOS Simulator / Android emulator** | Yes | Engine and rendering bugs | Performance, real keyboards, interruptions, sensors |
| **Real device** | Yes | Gestures, keyboard, memory, network, thermal | Nothing you care about |
| **Device cloud** | Yes | The tail, on demand | Feels slow; awkward for exploratory work |

The rule that follows: **one real device per engine family beats ten
emulators.** A cheap mid-range Android and any iPhone will find more than a
full grid of simulated Chrome. Rent the tail from a device cloud when a tier-3
report comes in, rather than owning it.

## Do not multiply the suite by the matrix

The temptation after building a ten-row matrix is to run the regression suite ten
times. That is ten times the work for a few percent more information, and it is
why cross-browser testing has a reputation for being where time goes to die.

Server-side logic is identical in every browser. So the tier-2 pass is a **thin
smoke of the things the browser actually decides**:

1. The page renders — no overlap, nothing clipped, nothing off-screen
2. Every input accepts input, including the date picker and the file field
3. The form submits and the success state appears
4. Payment or any third-party redirect completes and comes back
5. One print or download, if the product has one

Five checks, ten minutes per configuration. That is affordable every release,
which matters far more than being thorough once a quarter.

## A compatibility defect names its configuration

"Layout broken on mobile" is not a report. The contrast *is* the finding, so
write both sides:

~~~
Summary:  Checkout submit button unreachable — Safari / iOS, portrait
Works on: Chrome 149 / Windows 11 / 1440x900
Fails on: Safari / iOS 26.5 / iPhone 13 / 390x844 portrait, 100% text size
Steps:    Cart -> Checkout -> fill address -> tap Card number
Actual:   Keyboard covers Pay; page will not scroll further (screenshot)
Notes:    Rotating to landscape reveals the button. Not reproducible in
          dev-tools device mode at the same viewport.
~~~

Browser **and full version**, OS and version, device model, viewport, orientation
and text scale. That last line is the one that saves a day: it tells the
developer up front that the emulator will lie to them.

## Where TestForge fits

One case, many runs. Write the compatibility smoke once and execute it per
configuration, naming the run for the environment — *"2.4 smoke — Safari / iPhone
13"* — so the per-environment history is a thing you can read. A case that
passes on Chrome and fails on Safari is two results on one case, not two cases.

Tag those cases \`compat\` and they become the tier-2 selection: a saved filter,
not a decision you re-make under pressure every release.

**Next:** the users your matrix cannot see — keyboard-only, screen reader, low
vision — and the ten-minute pass that finds most of what fails them.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A user reports a broken layout in Chrome on their iPhone. You cannot reproduce it in Chrome on your laptop, at the same viewport width. What is the most likely explanation?",
      choices: [
        {
          id: "a",
          text: "Their Chrome version is older than yours, so it lacks the CSS the page uses",
        },
        {
          id: "b",
          text: "Chrome on iOS renders with WebKit, so it is Safari's engine — desktop Chrome never exercises it",
          correct: true,
        },
        {
          id: "c",
          text: "Mobile Chrome applies a different stylesheet to the same page",
        },
        {
          id: "d",
          text: "The report is unreliable; a viewport match makes the two cases equivalent",
        },
      ],
      explanation:
        "Every browser on iOS has to render with WebKit, so the Chrome interface on an iPhone is running Safari's engine underneath. Matching the viewport width matches only the layout space, not the engine that interprets the CSS — which is why this class of bug survives every desktop check. Version drift and a separate mobile stylesheet are both things worth checking in general, but neither explains a failure that follows the platform rather than the brand, and dismissing the report leaves a real defect in front of every iOS user you have.",
    },
    {
      id: "q2",
      stem: "You are building a device matrix for a consumer shopping site. Which basis should the tier-1 rows come from?",
      choices: [
        {
          id: "a",
          text: "Published global browser market share, so the matrix is defensible",
        },
        {
          id: "b",
          text: "Your own analytics, weighted by sessions and by completed orders, cut into tiers to about 95% with the remainder written down",
          correct: true,
        },
        {
          id: "c",
          text: "The newest version of every major browser, since users update automatically",
        },
        {
          id: "d",
          text: "Whatever configurations the team already has installed",
        },
      ],
      explanation:
        "The matrix is a selection decision, so it has to be built from the population it is protecting: your own traffic, weighted by revenue as well as sessions, because a browser that is a small share of visits can be a large share of checkouts. Global share describes a population that is not yours. Newest-only misses the users who cannot update — often on the exact devices where layouts break. And testing what the team has installed is the default this lesson exists to replace. Note that the 95% is only half the answer: naming the unsupported remainder is what turns coverage into an agreed decision.",
    },
    {
      id: "q3",
      stem: "Which of these can only be found on a real device — not in dev-tools device mode, and not reliably in a simulator?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The on-screen keyboard covering the submit button so it cannot be reached",
          correct: true,
        },
        {
          id: "b",
          text: "A half-filled form losing its state when the phone is rotated mid-flow",
          correct: true,
        },
        {
          id: "c",
          text: "A card that clips its text at a 375px viewport width",
        },
        {
          id: "d",
          text: "A payment flow that double-charges when a call interrupts it and the user returns",
          correct: true,
        },
      ],
      explanation:
        "The keyboard, the rotation and the interruption all come from the operating system and its real hardware: device mode emulates a viewport and touch events, and a simulator runs the right engine on the wrong machine with no real keyboard or call to interrupt it. Clipping at a given width is the exception — it is pure layout, which is exactly what device mode is good for and where it is worth using. That split is the useful one: emulate to find layout, borrow a phone to find behaviour.",
    },
  ],
};
