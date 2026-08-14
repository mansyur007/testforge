import type { Lesson } from "../../types";

export const testOracles: Lesson = {
  slug: "test-oracles",
  title: "Test oracles: how do you know it's wrong?",
  summary:
    "Requirements, comparable products, history, and heuristics for when there is no spec.",
  minutes: 10,
  status: "draft",
  body: `
## Every test has a hidden second half

A test case has two parts, and only one of them gets written down carefully.
The visible half is *what you do*. The invisible half is **how you decide the
result was wrong**.

That second half has a name: the **oracle**. It is the source you compare the
observed behaviour against. Every time you file a bug, you have consulted one,
whether or not you could name it.

Beginners assume there is exactly one oracle and it is the requirements
document. Then they meet real work, where the requirement is a Slack message
from March, and they conclude that without a spec nothing can be tested. That
conclusion is wrong, and this lesson is why.

## The requirement is one oracle, and it is not the best one

The requirements document is the most-cited oracle and the most over-trusted.
Three things go wrong with it:

- **It can be silent.** It says what happens for valid input and nothing about
  the empty string, and silence is not permission.
- **It can be ambiguous.** ShopMini's own rules say free shipping applies "over
  Rp 500,000" and separately that members always get free shipping and
  international never does. A member in Singapore hits both. No implementation
  can be correct against a contradiction.
- **It can be wrong.** A perfectly implemented requirement can still be a
  product that harms users. "It does what the spec says" is a defence for the
  developer, not a verdict on the software.

That third point is the one worth internalising. **Conformance to a spec is not
the definition of correct** — it is one piece of evidence about it. A tester who
can only compare against a document has outsourced their judgement to whoever
wrote it.

## The other oracles you already use

When there is no spec — or the spec is silent, ambiguous or suspect — you
compare against something else. These are the sources that do the work in
practice.

| Oracle | The question it asks | Where it fails |
|---|---|---|
| **History** | Did this behave differently before the change? | Old behaviour may have been the bug |
| **A comparable product** | How do other shops handle this? | Their choice may not suit this product |
| **A sibling feature** | Search does it this way; why does Cart not? | Inconsistency may be deliberate |
| **Claims** | Marketing, the help page, the UI's own labels | Claims drift from the code |
| **Standards & law** | HTTP status codes, currency rounding, tax rules, accessibility | Needs looking up; do not test from memory |
| **User expectation** | Will a real person be surprised? | Yours is not the average user's |
| **Purpose** | Does this achieve what the feature exists for? | Requires knowing the business |
| **Data & internal consistency** | Does the total equal the sum of the lines? | — this one rarely fails you |

Two of these deserve emphasis.

**Internal consistency** is the most reliable oracle in the list and the least
taught. You need no requirement at all to know that a cart subtotal must equal
the sum of its line items, that an order marked Shipped cannot have a null
address, or that the number in the header badge must match the number of rows on
the page. These are self-evident from the data, they are checkable without asking
anyone, and when they fail the bug is undeniable.

**Claims** is the cheapest. The product's own UI is making promises constantly —
a placeholder reading *"6-10 characters"*, a tooltip, a button labelled
*Save draft*. Every one of those is a testable assertion the product volunteered
about itself, and nobody has to approve it as a requirement first.

## Consistency heuristics, in one line each

A compact way to hold most of the above. Ask whether the software is consistent
with:

- **its history** — behaviour that changed without anyone deciding to change it
- **itself** — the same idea working two different ways in two places
- **comparable products** — a convention users bring with them
- **its claims** — the labels, docs and marketing it ships with
- **user expectations** — what a reasonable person would predict
- **its purpose** — what the feature is for
- **standards** — external rules that apply whether or not anyone wrote them down

Run a screen past that list and you will find things. It is the fastest way to
turn "I have no requirements" into a morning of real testing.

## Oracles have authority levels, and the report should say which

This is the part that separates a report that gets fixed from one that gets
argued with. When you file a finding, say **which oracle** you used, because it
tells the reader how much argument is available:

| Oracle used | The finding reads as | Likely response |
|---|---|---|
| Explicit requirement | "Violates AC-3" | Fixed, no discussion |
| Internal consistency | "Total ≠ sum of lines" | Fixed, no discussion |
| Standard | "Returns 200 on a failed write" | Usually fixed |
| The product's own claim | "Placeholder says 6-10, accepts 11" | Fixed, or the label changes |
| Comparable product | "Every other shop keeps the cart on logout" | A discussion |
| User expectation | "This will surprise people" | A discussion, and you need an argument |

Nothing in the bottom two rows is invalid — plenty of real defects live there.
But **presenting a heuristic finding as though it were a requirement violation
is how testers lose credibility**, and it only takes a couple of times. Write
"our cart empties on logout; Tokopedia, Shopee and Amazon all preserve it — is
that intentional?" and you get a decision. Write "cart emptying on logout is a
bug" with nothing behind it and you get "that's by design", correctly.

The strongest reports stack oracles. *"The placeholder says 6-10 characters
(claim), the API accepts 11 (inconsistency between layers), and the order then
fails at payment with a 500 (standard: that is a 400)"* is three independent
sources agreeing, and there is no reading of that where nothing is wrong.

## When you genuinely cannot tell

Sometimes you look at a behaviour and no oracle settles it. The member-shipping-
internationally case in ShopMini is exactly this: the rules contradict each
other, so whatever the code does, you cannot call it right or wrong.

**That is a finding, not a failure.** File it as a question against the
requirement rather than a defect against the code. An ambiguity found before
release costs one Slack message; found after release it costs a customer
argument, a support thread and a hotfix, and by then somebody has shipped a
guess.

> If you cannot say what the correct behaviour would be, do not guess and do not
> stay quiet. Write down both readings and who has to choose.

## Where TestForge fits

The **expected result** field on a case is where your oracle ends up, so write
it so the next person can tell which one you used. "Works correctly" names no
oracle and is unarguable in the worst way — nobody can check it and nobody can
disagree with it. "Subtotal equals the sum of the line items; shipping is
Rp 20,000 for a non-member domestic order at exactly Rp 500,000, per the stated
rule" names two, and a reviewer can challenge either.

**Next:** HTTP and the browser's dev tools — where a great many oracles stop
being a matter of opinion and start being something you can read off the wire.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "There is no specification for the feature you have been asked to test. Which is the strongest reason this does not prevent testing?",
      choices: [
        {
          id: "a",
          text: "You can write the missing requirements yourself and test against those",
        },
        {
          id: "b",
          text: "Several other oracles apply — the product's own claims, its internal consistency, its history and applicable standards",
          correct: true,
        },
        {
          id: "c",
          text: "Without a specification, any behaviour the developer implemented is correct by definition",
        },
        {
          id: "d",
          text: "You can test that the software does not crash, which needs no oracle at all",
        },
      ],
      explanation:
        "The requirements document is one oracle among many, and not the most reliable one. A subtotal that disagrees with its own line items is wrong with no document involved, and a placeholder promising 6-10 characters is a claim the product volunteered that you can hold it to. Inventing requirements substitutes your guess for a decision the business owns. \"No spec means anything is correct\" is the belief this lesson exists to remove, and a crash check still uses an oracle — it just happens to be one nobody argues with.",
    },
    {
      id: "q2",
      stem: "You find that ShopMini empties the cart when a user logs out. No requirement mentions it. Every major competitor preserves it. How should this be reported?",
      choices: [
        {
          id: "a",
          text: "As a defect: losing a user's cart is obviously wrong",
        },
        {
          id: "b",
          text: "As a finding that names the oracle — competitors preserve the cart — and asks whether the behaviour is intended",
          correct: true,
        },
        {
          id: "c",
          text: "Not at all, since no requirement is violated",
        },
        {
          id: "d",
          text: "As a defect against the requirements document, for failing to specify cart persistence",
        },
      ],
      explanation:
        "Comparable products are a legitimate oracle but a weak-authority one, and the report should carry that honestly: naming the source turns it into a decision somebody makes rather than a claim they can dismiss. Filing it as a flat defect invites a correct \"by design\" rejection and spends credibility you will want later. Staying silent throws away a real finding because it arrived from the wrong source. Filing a defect against the document for a gap you have not yet established matters puts the argument in the wrong place.",
    },
    {
      id: "q3",
      stem: "Which observations can be judged wrong using internal consistency alone, with no requirement to consult?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "The cart badge shows 3 items while the cart page lists 4 rows",
          correct: true,
        },
        {
          id: "b",
          text: "The order summary total is Rp 480,000 but its line items add up to Rp 500,000",
          correct: true,
        },
        {
          id: "c",
          text: "Free shipping starts above Rp 500,000 rather than at Rp 400,000",
        },
        {
          id: "d",
          text: "An order in the Shipped state has no shipping address stored",
          correct: true,
        },
      ],
      explanation:
        "A count that disagrees with what it counts, a total that disagrees with its own parts, and a state that contradicts the data it implies are all self-evidently broken — the software disagrees with itself, and you need nobody's approval to say so. The shipping threshold is different in kind: 500,000 is not inconsistent with anything, it is simply a business choice, and only the business can say whether it is the wrong one.",
    },
  ],
};
