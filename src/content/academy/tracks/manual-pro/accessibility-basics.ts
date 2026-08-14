import type { Lesson } from "../../types";

export const accessibilityBasics: Lesson = {
  slug: "accessibility-basics",
  title: "Accessibility basics",
  summary:
    "Keyboard, contrast, labels, screen readers — the checks that take ten minutes.",
  minutes: 12,
  status: "draft",
  body: `
## Three reasons, and the third one is why testers get good at this

The first is the obvious one: some of your users navigate with a keyboard, a
screen reader, 300% zoom, or a switch — and a checkout they cannot complete is a
defect, not a preference.

The second is that for a great many products it is **a legal requirement**, not a
virtue. Public-sector procurement in Europe references EN 301 549, the European
Accessibility Act covers a wide band of consumer products and services, and US
federal and public-body rules point at WCAG too. What applies to your employer is
a question for your employer's lawyers, not for you. Your job is narrower and
completely clear: find the failures and report them **against a named standard**.

The third reason is the one that turns testers into advocates. Accessibility
defects are almost always *semantic* defects — a button that is really a styled
\`div\`, an input with no associated label, a state conveyed only by colour. Those
same defects are what make automation brittle: a locator has nothing stable to
grab, so somebody writes \`div:nth-child(3) > span\` and it breaks next sprint.
Fixing accessibility fixes your automation's foundations. You will meet this again
in the automation track, from the other side.

And it is not a small minority. Add temporary and situational cases — an arm in a
cast, a phone in bright sun, a cracked screen, a noisy room with autoplay — and
you are describing everyone, eventually.

## The standard, in the part you need today

**WCAG 2.2**, three levels: A, AA, AAA. Almost every commitment you will ever see
is **AA**, so treat AA as the bar unless told otherwise.

Its criteria are numbered, and the numbers are how an accessibility finding stops
being an aesthetic argument. *"The contrast is a bit light"* is an opinion.
*"Body text at 2.8:1 fails 1.4.3 Contrast (Minimum), which requires 4.5:1"* is a
defect with a specification behind it. Learn the dozen numbers in this lesson and
you can write reports nobody argues with.

The four principles the criteria hang off (**POUR**) are worth one line each:
**Perceivable** — can they receive it; **Operable** — can they drive it;
**Understandable** — can they follow it; **Robust** — does it survive their
assistive technology.

## The ten-minute pass

Seven checks. None needs a specialist, all of them need doing before a release,
and in most products the first one alone finds something.

### 1. Put the mouse away

Tab, Shift+Tab, Enter, Space, Escape, arrow keys. Nothing else. Try to complete
your product's main flow.

- Can you **reach** every interactive thing — including that custom dropdown, the
  modal's close button and the icon-only actions in a table row?
- Is the **focus indicator always visible** (2.4.7)? A designer removing the
  "ugly outline" is the single most common accessibility regression in existence.
- Does focus follow the **visual order** (2.4.3)? A sidebar that comes last in
  the DOM but first on screen tabs in an order that makes no sense.
- Is focus ever **trapped** outside a modal (2.1.2) — a widget you can tab into
  and not out of?
- In a modal: does focus **move into it**, stay inside it, close on Escape, and
  **return** to the control that opened it?
- Is the focused element ever **hidden behind a sticky header** (2.4.11)? Tab
  slowly down a long page and watch.

This check is worth more than the other six combined, because a screen reader user
navigates by keyboard. Anything you cannot reach with Tab, they cannot reach at
all.

### 2. Click the label

Click the visible *text* of a form field — not the box, the words next to it. The
field should focus.

If it does not, the label is not associated with the input, which means a screen
reader reaches that field and announces something like *"edit text, blank"*. The
user is being asked to type something into a box with no name. That is 1.3.1 and
3.3.2, it is invisible on screen, and it takes one second per field to test.

Then the icon-only buttons: a bin, a pencil, a bare "×". Each needs an accessible
name. Open the browser's accessibility pane (dev tools → Accessibility) and read
what the element actually exposes; an empty name field is the defect (4.1.2).

### 3. Zoom

Two different checks, and people conflate them:

- **Page zoom to 400%** at a 1280px window — content must reflow to the
  equivalent of a 320px column with **no two-dimensional scrolling** (1.4.10).
  Having to scroll sideways to read every line of a paragraph is the failure.
- **Text-only enlargement to 200%** (1.4.4) — where fixed-height buttons and
  cards clip their own labels.

On mobile, the same thing arrives as system font scaling, which the previous
lesson listed as a supported configuration for exactly this reason.

### 4. Contrast

The thresholds, which are all you need to remember:

| What | Minimum ratio |
|---|---|
| Body text | **4.5:1** |
| Large text (≥24px, or ≥18.7px bold) | **3:1** |
| UI component boundaries, meaningful graphics, focus indicators | **3:1** |

Any browser colour-picker or a contrast-checker extension gives you the number in
seconds. Where the failures always are: placeholder text used as a label, "ghost"
buttons in a pale brand colour, light grey helper text under fields, text sitting
on a photograph, and the focus ring itself.

### 5. Never colour alone (1.4.1)

Take a screenshot and desaturate it, or just squint. Is any information *only*
carried by colour?

- the invalid field with a red border and no message
- the green dot / red dot status column with no text or shape
- *"Required fields are shown in red"*
- a chart whose six lines are distinguished by hue alone

The fix is always to add a second channel: text, an icon, a pattern, a label.

### 6. Errors that work (3.3.1, 3.3.3)

Submit a form wrong on purpose, then check four things: the message **names the
field** and says how to fix it; it is **text near the field**, not only a red
outline; it is **programmatically tied** to the input so a screen reader
announces it; and the form has not **thrown away** what you already typed
(3.3.7).

That last one is not pedantry — a screen reader user who has to re-enter eight
fields to fix one typo will abandon.

### 7. One screen reader smoke test

Ten minutes with a real screen reader teaches more than an hour of reading about
one. NVDA on Windows is free; VoiceOver is built into macOS and iOS.

Turn it on and Tab through a single form with your eyes on the screen (nobody is
asking you to work blind). For each control, listen for three things — its
**name**, its **role**, and its **state**: *"Email, edit, required, invalid"*. A
control that announces a role and no name, or a checked box that never says
"checked", is 4.1.2 in the wild.

You are not simulating a screen reader user; they are far better at it than you.
You are catching the announcements that are **missing entirely**, which is a much
lower bar and still finds plenty.

## Run the scanner last, not first

axe DevTools, Lighthouse and WAVE are genuinely useful, take one click, and should
be in every release. They are also the source of the most common wrong conclusion
in this whole area:

| Automated tools find | Only a human finds |
|---|---|
| Missing \`alt\`, empty buttons, missing form labels | Whether the \`alt\` **describes the image** |
| Contrast on solid backgrounds | Whether the tab order **makes sense** |
| Missing page language, duplicate ids | Whether the error message is **understandable** |
| Invalid ARIA, wrong nesting | Whether a custom widget is **operable** at all |

Depending on whose study you believe, automated checks catch somewhere between a
third and a half of real issues. So **"Lighthouse says 100" means the page is not
obviously broken.** It does not mean anyone can use it — a page with an alt
attribute reading \`"image1.png"\` on every image scores full marks.

> **No ARIA beats bad ARIA.** A native \`<button>\` arrives accessible for free.
> A \`<div role="button">\` is a promise you then have to keep by hand, with a
> tabindex, Enter and Space handlers and a focus style — and one of those is
> always missing. Meanwhile \`aria-hidden\` on something focusable produces the
> worst outcome available: an element a keyboard lands on and a screen reader
> insists does not exist.

## Reporting one so it gets fixed

Two things separate an accessibility defect that gets scheduled from one that
sits in the backlog forever: the **criterion** and the **user impact**.

~~~
Summary:  Checkout cannot be completed with a keyboard — Pay button unreachable
WCAG:     2.1.1 Keyboard (A), 2.4.7 Focus Visible (AA)
Impact:   Keyboard and screen reader users cannot buy anything. No workaround.
Steps:    Cart -> Checkout, then Tab from the Card number field
Actual:   Focus jumps from Card number to the footer links; Pay is skipped
Expected: Pay receives focus in visual order and activates with Enter or Space
Note:     Pay is a <div onclick>; a <button> would fix both criteria
~~~

Then hold the line on severity. *"A user cannot complete a purchase"* is a
blocker whether the cause is a null pointer or a missing tabindex, and "cosmetic"
is the label this class of bug gets given when nobody in the room is affected by
it. Being the person who says that out loud is part of the job.

## Where TestForge fits

Make the ten-minute pass a **suite**, not a good intention: one case per check
above, run against your two or three critical flows every release. Write each
expected result as an observable fact with its criterion in it — *"the focus
indicator is visible on every control in the flow (2.4.7)"* — so a different
tester gets the same verdict you would.

Tag the defects \`a11y\` and you get the argument's other half for free: a count
that goes up or down over releases, which is what turns a personal crusade into a
tracked quality attribute.

**Next:** the rest of the qualities nobody wrote a requirement for — speed,
security and robustness — and the cheap first checks that find the embarrassing
ones.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "A developer closes your accessibility findings with \"Lighthouse gives this page 100 for accessibility\". What is the accurate response?",
      choices: [
        {
          id: "a",
          text: "The score is only valid on the page it was run against, so other pages still need scanning",
        },
        {
          id: "b",
          text: "Automated tools check a subset of criteria and cannot judge whether alt text, labels, tab order or error messages are meaningful — a perfect score is compatible with an unusable page",
          correct: true,
        },
        {
          id: "c",
          text: "Lighthouse measures WCAG level A only, so the AA criteria are untested",
        },
        {
          id: "d",
          text: "The score is unreliable because it varies between runs",
        },
      ],
      explanation:
        "A scanner can tell that an image has an alt attribute; it cannot tell that the alt reads \"image1.png\", that the tab order jumps around the screen, or that the error message is incomprehensible. Studies put automated detection somewhere between a third and a half of real issues, so a full score means \"nothing obviously broken\", not \"usable\". The per-page point is true but far weaker — it implies the remaining pages just need the same scan. The level claim is simply wrong, and accessibility scans are deterministic, unlike the performance score people confuse them with.",
    },
    {
      id: "q2",
      stem: "You click the visible text \"Email address\" next to a form field and nothing happens — focus stays where it was. What does that tell you?",
      choices: [
        {
          id: "a",
          text: "Nothing much; clicking labels is a convenience, not a requirement",
        },
        {
          id: "b",
          text: "The label is not programmatically associated with the input, so a screen reader will announce the field with no name",
          correct: true,
        },
        {
          id: "c",
          text: "The field is disabled or read-only",
        },
        {
          id: "d",
          text: "The label needs an ARIA role to be announced",
        },
      ],
      explanation:
        "Focus moving on a label click is a side effect of the association between the label and the input, so the click is a one-second proxy for a wiring check you otherwise need dev tools for. Without that association the field is announced as an unnamed edit box — the user is asked to type into something with no name, failing 1.3.1 and 3.3.2. A disabled field would also refuse focus, which is why you look at the field's state before concluding, but a normal enabled field that ignores its label is the association bug. Adding a role to the label is the wrong fix: a plain label element is already the right semantics, it just needs to point at the input.",
    },
    {
      id: "q3",
      stem: "Which of these are genuine accessibility defects?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The focus outline has been removed site-wide because a designer found it ugly",
          correct: true,
        },
        {
          id: "b",
          text: "An invalid field is indicated by a red border and nothing else",
          correct: true,
        },
        {
          id: "c",
          text: "A purely decorative divider icon carries an empty alt attribute",
        },
        {
          id: "d",
          text: "A row's delete action is an icon-only button with no accessible name",
          correct: true,
        },
      ],
      explanation:
        "Removing the focus indicator fails 2.4.7 and leaves keyboard users with no idea where they are; a red border alone carries the error in colour only, failing 1.4.1 and 3.3.1 together; and an unnamed icon button announces a role with no name, failing 4.1.2 — the user is told there is a button and not what it does. The empty alt is the odd one out, and it is correct practice rather than a defect: a decorative image should be hidden from assistive technology, and an empty alt is exactly how you do that. Describing it would add noise without adding information.",
    },
  ],
};
