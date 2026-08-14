import type { Lesson } from "../../types";

export const sqlForQa: Lesson = {
  slug: "sql-for-qa",
  title: "SQL for verification",
  summary:
    "SELECT, JOIN and GROUP BY — enough to prove what the screen is claiming.",
  minutes: 14,
  status: "draft",
  body: `
## You are not learning SQL to build things

A developer learns SQL to write features. You are learning it for two much
narrower jobs, and they need perhaps a tenth of the language:

1. **Verification** — the screen says the order is Paid. Is it *stored* as Paid?
2. **Test data** — you need an account with an expired discount code and three
   past orders, and clicking your way there takes twenty minutes.

That is it. \`SELECT\`, a \`WHERE\`, a couple of \`JOIN\`s and \`GROUP BY\` will cover
almost every question you have. You can skip the rest of the language for now
without guilt.

## Why the screen is not enough

A confirmation message means the application *believes* it succeeded. Between
that belief and the database sit caches, queues, retries and transactions, and
all of them are places where a UI can tell the truth about what it did while the
data says something else.

The bugs that hide in that gap are the expensive ones, because they pass every
UI test:

- the order shows as Paid, and \`orders.status\` is still \`PENDING\` — a webhook
  updated the screen and the write failed
- the address updated on screen, and one of two tables did not get it — a
  partial write, and now two screens disagree about the same customer
- a deleted item disappears from the list but the row is still there with
  \`deleted_at\` set, and it comes back in the monthly export
- the total on screen is right because the front end recalculated it, and the
  stored total is wrong

Every one of those is invisible to a tester who only reads screens.

## The five clauses, in the order the database runs them

Worth knowing because it explains the error you will hit most often:

~~~
FROM      which table
WHERE     which rows            <- runs BEFORE grouping
GROUP BY  fold rows together
HAVING    which groups          <- filters AFTER grouping
SELECT    which columns
ORDER BY  sort
~~~

**\`WHERE\` filters rows; \`HAVING\` filters groups.** You cannot put \`COUNT(*) > 1\`
in a \`WHERE\` — at that point the counting has not happened yet. That single fact
is behind most of the errors a beginner gets.

## Enough syntax to be useful

Assume ShopMini's schema: \`orders\`, \`order_items\`, \`customers\`, \`discount_codes\`.

~~~sql
-- The order I just placed
SELECT id, status, total, created_at
FROM orders
WHERE customer_email = 'buyer@shopmini.test'
ORDER BY created_at DESC
LIMIT 5;
~~~

\`ORDER BY created_at DESC LIMIT 5\` is the shape you will type most often —
*"show me what just happened"*.

~~~sql
-- Does the stored total match the sum of its line items?
SELECT o.id,
       o.total                              AS stored_total,
       SUM(oi.unit_price * oi.quantity)     AS calculated_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 'ord_8831'
GROUP BY o.id, o.total;
~~~

That query is the *internal consistency* oracle from the oracles lesson, written
down. Nobody has to approve it as a requirement: if those two columns disagree,
the software is wrong, and you can say so without asking anyone.

## JOIN, in the only detail you need

A \`JOIN\` follows a relationship: this order's items, this item's product, this
customer's orders. \`INNER JOIN\` (the default) keeps only rows that matched on
**both** sides.

That default is a trap for testers, and here is the shape of it:

~~~sql
-- WRONG: silently hides orders that have no items
SELECT o.id, COUNT(oi.id) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- RIGHT: keeps every order; an empty one shows 0
SELECT o.id, COUNT(oi.id) AS items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
~~~

An order with no line items **is exactly the bug you are hunting**, and an
\`INNER JOIN\` deletes it from your results. When you are looking for missing or
orphaned data, reach for \`LEFT JOIN\` — and then \`WHERE oi.id IS NULL\` to see
only the broken ones:

~~~sql
-- Orders with no line items at all
SELECT o.id, o.status, o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE oi.id IS NULL;
~~~

> **A query that finds nothing is not proof.** It means "no rows matched this
> query" — which is also what a typo in a column value produces. Before trusting
> an empty result, run the same query without the \`WHERE\` and check it returns
> anything at all.

## GROUP BY, for the questions worth asking

Counting is where a tester finds problems nobody reported:

~~~sql
-- Duplicate orders: the same customer, same total, within a minute
SELECT customer_email, total, COUNT(*) AS n
FROM orders
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY customer_email, total, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1;
~~~

Double-submit, found in one query rather than by clicking fast. And the shape
generalises — *"group by the thing that should be unique, keep the groups with
more than one"* is how you find duplicates of anything.

~~~sql
-- Distribution check: are all the states reachable?
SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY 2 DESC;
~~~

Run that after a release. A state with zero rows that used to have thousands is a
bug that no test case was written for.

## Rules for touching a real database

1. **Read-only, always.** Ask for a read-only account and use it. The one time
   you run an \`UPDATE\` without a \`WHERE\` is the day you learn why.
2. **Never on production without permission**, and never with anything that
   locks. A heavy query on a live database is an outage you caused.
3. **Wrap anything you must write in a transaction**, and check before you
   commit:

~~~sql
BEGIN;
UPDATE orders SET status = 'PAID' WHERE id = 'ord_8831';
-- look at it first
SELECT id, status FROM orders WHERE id = 'ord_8831';
COMMIT;   -- or ROLLBACK if it is not what you meant
~~~

4. **Watch what you copy into a ticket.** Query results are real customer data.
   Emails, addresses and payment details do not belong in a bug report — quote
   the ids and the offending column, not the row.

## The habit worth building

Whenever you verify something important through the UI, **ask the database the
same question.** It takes a minute, and it is the check that catches the class of
defect where the application and its data disagree — the class no amount of
clicking will ever reach.

## Where TestForge fits

Put the query in the case. A step that reads *"verify the order is paid"* is a
different test depending on who runs it; a step that reads
\`SELECT status FROM orders WHERE id = :orderId\` with an expected result of
\`PAID\` is the same test every time, and it is the difference between a case that
checks the screen and one that checks the system.

Anything you find this way becomes a defect with the query attached — the
developer can re-run it, which means they cannot fail to reproduce it.

**Next:** taking all of this to more than one device — building a browser and
device matrix from analytics instead of from superstition.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "You want to find orders that have no line items — a corruption bug you suspect exists. Which query shape will find them?",
      choices: [
        {
          id: "a",
          text: "JOIN orders to order_items and group by order id, looking for a count of zero",
        },
        {
          id: "b",
          text: "LEFT JOIN orders to order_items, then WHERE the item id IS NULL",
          correct: true,
        },
        {
          id: "c",
          text: "SELECT from order_items WHERE order_id IS NULL",
        },
        {
          id: "d",
          text: "JOIN the two tables and add HAVING COUNT(*) = 0",
        },
      ],
      explanation:
        "An inner join keeps only rows that matched on both sides, so it silently deletes the very orders you are hunting — and no amount of grouping afterwards can recover a row the join already dropped, which is why the count-of-zero and HAVING variants both return nothing. A left join keeps every order and leaves the item columns null where nothing matched, so filtering on that null is what isolates them. Searching order_items answers a different question: items pointing at no order, rather than orders with no items.",
    },
    {
      id: "q2",
      stem: "The checkout screen shows an order as Paid. Why is querying the database worth the extra minute?",
      choices: [
        {
          id: "a",
          text: "It is faster than re-checking through the interface",
        },
        {
          id: "b",
          text: "The screen shows what the application believes; caches, queues and failed writes can make the stored data disagree",
          correct: true,
        },
        {
          id: "c",
          text: "Database values are the requirement, so the screen is only ever an approximation",
        },
        {
          id: "d",
          text: "It lets you correct the row if the status is wrong",
        },
      ],
      explanation:
        "Between the confirmation message and the stored row sit caches, queues, retries and transactions, and each is a place where the UI can honestly report a success whose write never landed. That gap is where the expensive bugs live, because they pass every UI test. Speed is not the reason. The stored value is not automatically the requirement either — either side can be the one that is wrong, which is exactly why comparing them is informative. And correcting the row would destroy the evidence you came for.",
    },
    {
      id: "q3",
      stem: "Which of these are sound practice when querying a real database as a tester?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Use a read-only account for verification work",
          correct: true,
        },
        {
          id: "b",
          text: "Before trusting an empty result, re-run the query without its WHERE clause",
          correct: true,
        },
        {
          id: "c",
          text: "Paste the full result rows into the defect so the developer has all the context",
        },
        {
          id: "d",
          text: "Wrap any write you must make in a transaction and check the result before committing",
          correct: true,
        },
      ],
      explanation:
        "A read-only account removes a whole class of accident, and a transaction gives you a way back from the writes you genuinely need. Re-running without the filter is what distinguishes \"nothing is broken\" from \"my query was wrong\" — both return zero rows and they look identical. Pasting whole rows is the one to avoid: query results are real customer data, and emails, addresses and payment details do not belong in a ticket. Quote the ids and the column that is wrong.",
    },
  ],
};
