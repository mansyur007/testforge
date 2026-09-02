// F-47: the "Checkout & Payment" starter pack.
//
// The money path, where a bug costs real currency rather than a support ticket.
// Weighted accordingly: quantity and threshold boundaries, declined and
// timed-out payments, double-charge prevention, and order states that must not
// be reachable.
//
// Thresholds are written as *the configured value* rather than as numbers,
// because every shop has different ones and a template that hard-codes
// "Rp 500,000" is a template someone has to edit 30 times before running.

export const CHECKOUT_TEMPLATE = {
  slug: "checkout-payment",
  name: "Checkout & Payment",
  category: "COMMERCE",
  order: 40,
  summary:
    "Cart, shipping, discounts, payment and refunds — quantity boundaries, declined cards, double-charge prevention and invalid state transitions.",
  description: `A starting point for any cart-to-payment flow.

This is the path where a defect costs money rather than goodwill, so the
emphasis is on the cases that are awkward to reproduce and easy to skip: the
free-shipping threshold at exactly the limit, a payment that times out rather
than failing cleanly, a Back button pressed after paying, and order transitions
that should be impossible.

**Adapt before you run.** Thresholds, currency, quantity limits and the set of
order states are written as *the configured value* — fill in your own, and delete
the suites for features you do not have (many shops have no refund flow in the
product itself).`,
  content: {
    suites: [
      {
        key: "cart",
        name: "Cart",
        description:
          "Before checkout: quantities, totals, and a cart that has to survive being left alone.",
        cases: [
          {
            key: "cart-add-item",
            title: "Add an item to the cart",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "An empty cart and an in-stock item.",
            steps: [
              { action: "Open the item and add it to the cart.", expected: "A confirmation is shown and the cart indicator increments." },
              { action: "Open the cart.", expected: "The item is listed once, with quantity 1 and the correct unit price." },
            ],
            expectedResult:
              "The cart holds exactly the item added, at the price shown on the product page.",
          },
          {
            key: "cart-quantity-boundaries",
            title: "Quantity is enforced at both ends of its allowed range",
            coverage: "boundary",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "One item in the cart. The allowed quantity range is known; call the maximum M.",
            steps: [
              { action: "Set the quantity to exactly M and update.", expected: "It is accepted and the line total is unit price × M." },
              { action: "Set the quantity to M+1.", expected: "It is refused with a stated limit, or clamped to M with a message." },
              { action: "Set the quantity to 0.", expected: "Either the line is removed, or it is refused — whichever the product specifies, but not a zero-quantity line left in the cart." },
              { action: "Set the quantity to a negative number, and then to a decimal such as 1.5.", expected: "Both are refused." },
            ],
            expectedResult:
              "Only whole quantities inside the allowed range reach the cart, and the maximum is inclusive.",
          },
          {
            key: "cart-quantity-exceeds-stock",
            title: "Quantity above available stock is refused",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "An item with a known, limited stock level S.",
            steps: [
              { action: "Set the cart quantity to exactly S.", expected: "It is accepted." },
              { action: "Set it to S+1.", expected: "It is refused with a message stating what is available." },
              { action: "Attempt to check out with a quantity above stock, by manipulating the request directly.", expected: "The server refuses; no oversold order is created." },
            ],
            expectedResult:
              "Stock is enforced at checkout as well as in the cart UI.",
          },
          {
            key: "cart-remove-item",
            title: "Removing an item updates the cart and its total",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A cart with two different items.",
            steps: [
              { action: "Remove one item.", expected: "It disappears from the cart." },
              { action: "Check the total.", expected: "It has fallen by exactly that line's total." },
              { action: "Remove the remaining item.", expected: "The cart shows a proper empty state, not a zero-total cart page." },
            ],
            expectedResult:
              "Removal is reflected in both the contents and the arithmetic.",
          },
          {
            key: "cart-totals-arithmetic",
            title: "The cart total equals the sum of its lines plus configured charges",
            coverage: "boundary",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions:
              "A cart with at least three items, including one with quantity above 1 and one with a price having fractional units.",
            steps: [
              { action: "Compute the expected subtotal by hand from unit prices and quantities.", expected: "It matches the displayed subtotal exactly." },
              { action: "Compare the displayed total against subtotal plus shipping, tax and any fee.", expected: "The arithmetic is exact — no rounding drift of a minor unit." },
              { action: "Change one quantity and recheck.", expected: "Subtotal and total both update consistently." },
            ],
            expectedResult:
              "Displayed money is arithmetically correct at every level, including rounding.",
          },
          {
            key: "cart-persists",
            title: "The cart survives a page reload and a return visit",
            coverage: "compatibility",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A cart with at least one item, as a signed-in user.",
            steps: [
              { action: "Reload the page.", expected: "The cart still holds the same items and quantities." },
              { action: "Close the browser, reopen it and sign in again.", expected: "The cart is still there." },
              { action: "Open the account on a second browser and check the cart.", expected: "It matches, if the product syncs carts across devices." },
            ],
            expectedResult:
              "A cart is not lost to a refresh, and for a signed-in user it belongs to the account rather than the tab.",
          },
          {
            key: "cart-price-change",
            title: "A price change between adding and checking out is surfaced, not silently applied",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "An item in the cart, and the ability to change its price in the catalogue.",
            steps: [
              { action: "Note the price shown in the cart, then change the catalogue price.", expected: "The catalogue reflects the new price." },
              { action: "Return to the cart and proceed towards checkout.", expected: "The change is made visible before payment — the user is not charged a different amount than the one displayed to them." },
              { action: "Complete the order.", expected: "The amount charged matches the amount last shown and confirmed." },
            ],
            expectedResult:
              "Nobody is charged a price they were never shown.",
          },
        ],
      },
      {
        key: "shipping-address",
        name: "Shipping & Address",
        description:
          "Where it goes and what that costs — including the threshold case that is always off by one somewhere.",
        cases: [
          {
            key: "ship-valid-address",
            title: "Enter a valid shipping address and see a shipping cost",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A cart with at least one item.",
            steps: [
              { action: "Enter a complete, valid shipping address.", expected: "It is accepted with no validation errors." },
              { action: "Continue to the shipping step.", expected: "A shipping cost and available methods are shown." },
              { action: "Check the order total.", expected: "It includes the shipping cost." },
            ],
            expectedResult:
              "A valid address yields a priced, selectable shipping option.",
          },
          {
            key: "ship-required-fields",
            title: "An incomplete address is refused with each missing field named",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A cart at the address step.",
            steps: [
              { action: "Submit the address form empty.", expected: "Each required field is individually named." },
              { action: "Fill in everything except the postal code and submit.", expected: "Only the postal code is flagged." },
              { action: "Enter a postal code of the wrong format for the selected country.", expected: "It is refused with a format message." },
            ],
            expectedResult:
              "Address validation is per-field and country-aware.",
          },
          {
            key: "ship-free-threshold",
            title: "The free-shipping threshold is correct at exactly the limit",
            coverage: "boundary",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions:
              "The free-shipping threshold is known; call it T. Items are available to hit exact subtotals.",
            steps: [
              { action: "Build a cart with a subtotal of exactly T-1 minor unit.", expected: "Shipping is CHARGED." },
              { action: "Build a cart with a subtotal of exactly T.", expected: "Shipping is free — assuming the rule is 'T or more'; confirm which way the specification reads." },
              { action: "Build a cart with a subtotal of exactly T+1 minor unit.", expected: "Shipping is free." },
              { action: "Remove an item to drop back below T.", expected: "Shipping is charged again and the total updates." },
            ],
            expectedResult:
              "The threshold is inclusive or exclusive exactly as specified, and it re-evaluates when the cart changes.",
          },
          {
            key: "ship-method-changes-total",
            title: "Changing the shipping method updates the total",
            coverage: "positive",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "An address entered and at least two shipping methods offered.",
            steps: [
              { action: "Note the total with the default method selected.", expected: "A total is shown." },
              { action: "Select a different method.", expected: "The shipping line and the total both update to the new cost." },
              { action: "Switch back.", expected: "The original total is restored exactly." },
            ],
            expectedResult:
              "Method selection drives the total, in both directions, with no residue.",
          },
          {
            key: "ship-unsupported-destination",
            title: "An unsupported destination is refused before payment, not after",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A country or region known not to be served.",
            steps: [
              { action: "Enter an address in the unsupported destination.", expected: "The user is told it is not served." },
              { action: "Attempt to continue to payment.", expected: "It is blocked." },
              { action: "Attempt to submit the order directly, bypassing the UI.", expected: "The server refuses it; no order is created." },
            ],
            expectedResult:
              "An undeliverable order is never taken, and certainly never paid for.",
          },
          {
            key: "ship-conflicting-rules",
            title: "Two shipping rules that contradict each other resolve to a documented outcome",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "Two rules that can both apply and disagree — for example members always ship free, but a destination class never does.",
            steps: [
              { action: "Construct an order where both rules apply.", expected: "Checkout proceeds without erroring." },
              { action: "Read the shipping charge.", expected: "It matches the documented precedence between the two rules." },
              { action: "Compare with the specification.", expected: "They agree, and the outcome is not merely whichever rule happened to run last." },
            ],
            expectedResult:
              "Rule precedence is defined and implemented, rather than emerging from evaluation order.",
          },
        ],
      },
      {
        key: "discounts",
        name: "Discounts & Promotions",
        description:
          "Codes: the field most likely to be brute-forced, and the arithmetic most likely to go negative.",
        cases: [
          {
            key: "discount-valid-code",
            title: "A valid discount code reduces the total",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A cart and a known-valid, unexpired code.",
            steps: [
              { action: "Enter the code and apply it.", expected: "A success confirmation names the discount." },
              { action: "Check the total.", expected: "It has fallen by exactly the expected amount or percentage." },
              { action: "Remove the code.", expected: "The total returns exactly to its original value." },
            ],
            expectedResult:
              "The discount applies and reverses cleanly, with exact arithmetic both ways.",
          },
          {
            key: "discount-invalid-code",
            title: "Unknown, expired and malformed codes are each refused clearly",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A cart. A code known to be expired is available.",
            steps: [
              { action: "Apply a code that does not exist.", expected: "It is refused as invalid." },
              { action: "Apply a known expired code.", expected: "It is refused, ideally saying it has expired rather than that it is unknown." },
              { action: "Apply a code with the wrong length or illegal characters.", expected: "It is refused by format validation." },
              { action: "Check the total after each.", expected: "It is unchanged every time." },
            ],
            expectedResult:
              "No invalid code changes the total, and the messages distinguish the failure modes users can act on.",
          },
          {
            key: "discount-case-insensitive",
            title: "Codes match regardless of letter case and surrounding whitespace",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A valid code whose canonical form is known.",
            steps: [
              { action: "Apply the code in lower case.", expected: "It is accepted." },
              { action: "Apply it in upper case.", expected: "It is accepted." },
              { action: "Apply it with a leading and trailing space.", expected: "It is trimmed and accepted." },
            ],
            expectedResult:
              "A user retyping a code from an email is not defeated by capitalisation.",
          },
          {
            key: "discount-cannot-go-negative",
            title: "A discount larger than the subtotal cannot produce a negative total",
            coverage: "boundary",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions:
              "A discount whose value exceeds a small cart's subtotal — a fixed-amount voucher is the usual case.",
            steps: [
              { action: "Build a cart with a subtotal below the discount's value.", expected: "The cart is priced normally." },
              { action: "Apply the discount.", expected: "The order total floors at zero, or the code is refused as inapplicable." },
              { action: "Read the total and any shipping line.", expected: "Neither is negative, and no refund or credit is implied." },
              { action: "Attempt to complete the order.", expected: "Either it completes at zero, or it is refused — but no negative charge is ever created." },
            ],
            expectedResult:
              "No arrangement of discounts makes the shop pay the customer.",
          },
          {
            key: "discount-single-use",
            title: "A single-use code cannot be used twice",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "A code marked single-use, and an account that has already redeemed it.",
            steps: [
              { action: "Apply the code on a new order.", expected: "It is refused as already used." },
              { action: "Apply it while signed in as a different account, if it is per-user.", expected: "The specified behaviour occurs." },
              { action: "Attempt to apply it twice in one cart.", expected: "It counts once, not twice." },
            ],
            expectedResult:
              "Usage limits are enforced per their definition, including within a single cart.",
          },
          {
            key: "discount-stacking",
            title: "Stacking rules for multiple codes are enforced",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "Two valid codes and a known stacking policy (allowed, disallowed, or best-one-wins).",
            steps: [
              { action: "Apply the first code.", expected: "It applies." },
              { action: "Apply the second.", expected: "The policy is enforced — refused, replaced, or added." },
              { action: "Check the total against the policy.", expected: "It matches, and the discount was not applied twice by adding the same code again." },
            ],
            expectedResult:
              "The stacking policy is implemented, not merely documented.",
          },
        ],
      },
      {
        key: "payment",
        name: "Payment",
        description:
          "Taking the money. The failure modes here are the expensive ones: double charges, and payments whose outcome is unknown.",
        cases: [
          {
            key: "pay-successful",
            title: "Pay for an order successfully",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "A cart at the payment step, and valid test payment credentials.",
            steps: [
              { action: "Enter valid payment details and submit.", expected: "The payment is accepted." },
              { action: "Observe the result.", expected: "An order confirmation is shown with an order reference." },
              { action: "Check the order record and the payment provider.", expected: "The order is marked paid, for exactly the amount displayed." },
            ],
            expectedResult:
              "One order exists, marked paid, for the amount the customer agreed to.",
          },
          {
            key: "pay-declined",
            title: "A declined payment leaves the order unpaid and recoverable",
            coverage: "negative",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "Test credentials that always decline.",
            steps: [
              { action: "Submit payment with the declining credentials.", expected: "A decline message is shown." },
              { action: "Check the order state.", expected: "It is not marked paid, and no fulfilment has started." },
              { action: "Check the cart.", expected: "It is intact — the customer has not lost their basket to a failed payment." },
              { action: "Retry with valid credentials.", expected: "The payment succeeds and the order completes." },
            ],
            expectedResult:
              "A decline is recoverable in place, and never produces a half-paid order.",
          },
          {
            key: "pay-invalid-details",
            title: "Invalid card details are refused by field validation before submission",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "At the payment step.",
            steps: [
              { action: "Enter a card number failing the checksum and submit.", expected: "It is refused by validation." },
              { action: "Enter an expiry date in the past.", expected: "It is refused." },
              { action: "Enter a security code of the wrong length.", expected: "It is refused." },
              { action: "Check whether any request reached the payment provider.", expected: "None did — these are caught client-side." },
            ],
            expectedResult:
              "Obviously invalid details never become a provider request or a failed-payment record.",
          },
          {
            key: "pay-no-double-charge",
            title: "Submitting payment twice does not charge twice",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions:
              "At the payment step with valid credentials. Throttle the network so the request is observably slow.",
            steps: [
              { action: "Submit the payment and click the button repeatedly while it is in flight.", expected: "The control is disabled after the first click; no second request is sent." },
              { action: "Once confirmed, press the browser Back button and resubmit the payment form.", expected: "No second charge is taken — the order is recognised as already paid." },
              { action: "Reload the confirmation page.", expected: "No further charge." },
              { action: "Check the payment provider.", expected: "Exactly ONE charge exists for this order." },
            ],
            expectedResult:
              "One order produces one charge, regardless of double clicks, Back, or refresh — the single most expensive bug in this flow.",
          },
          {
            key: "pay-timeout",
            title: "A payment that times out resolves to a definite state",
            coverage: "negative",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions:
              "The ability to simulate a provider timeout or a dropped connection after the request is sent.",
            steps: [
              { action: "Submit a payment and cut the connection before the response returns.", expected: "The UI reports an indeterminate or failed state rather than claiming success." },
              { action: "Reconnect and reload the order.", expected: "The order settles into exactly one state — paid or not paid — and not a permanent 'pending' the customer cannot escape." },
              { action: "Check the payment provider against the order state.", expected: "They agree. Money taken means the order is paid; no money taken means it is not." },
            ],
            expectedResult:
              "The order state and the provider never disagree, which is what stops a customer being charged for an order the shop thinks failed.",
          },
          {
            key: "pay-amount-tamper",
            title: "The charged amount cannot be altered by tampering with the request",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "At the payment step, with access to devtools or an HTTP client.",
            steps: [
              { action: "Submit the payment request with the amount field reduced.", expected: "The server refuses it, or charges the correct server-computed amount." },
              { action: "Submit with the discount or shipping fields altered.", expected: "The server recomputes and ignores the client's figures." },
              { action: "Check the resulting charge.", expected: "It equals the server-side order total, never the tampered value." },
            ],
            expectedResult:
              "The amount is computed and enforced server-side; the client cannot set its own price.",
          },
          {
            key: "pay-no-card-data-stored",
            title: "Full card details are not stored or echoed by the application",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "A completed payment, and access to logs and stored records.",
            steps: [
              { action: "Inspect the order record and any related stored data.", expected: "No full card number and no security code is present — at most a masked value and a provider token." },
              { action: "Inspect the application logs for the payment request.", expected: "No card number or security code was logged." },
              { action: "Reopen the order confirmation and the emailed receipt.", expected: "Only masked details are shown." },
            ],
            expectedResult:
              "The application never retains or displays data it has no business holding.",
          },
          {
            key: "pay-session-expiry",
            title: "A session that expires during checkout does not lose or duplicate the order",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "A short session timeout in a test environment, and a cart at the payment step.",
            steps: [
              { action: "Leave the payment step idle until the session expires.", expected: "The session ends." },
              { action: "Submit the payment.", expected: "The user is sent to sign in rather than charged silently." },
              { action: "Sign in again and check the cart and orders.", expected: "The cart is intact, and no order or charge was created by the expired attempt." },
            ],
            expectedResult:
              "An expired session cannot produce a charge, and does not cost the customer their cart.",
          },
        ],
      },
      {
        key: "order-lifecycle",
        name: "Order Lifecycle & Refund",
        description:
          "After the money moves: which transitions are legal, and which must be impossible.",
        cases: [
          {
            key: "order-confirmation",
            title: "A completed order is visible with the right details and a receipt",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A successfully paid order.",
            steps: [
              { action: "Read the confirmation screen.", expected: "It shows an order reference, the items, the amount paid and the shipping address." },
              { action: "Open the order from the account's order history.", expected: "The same details, unchanged." },
              { action: "Check the emailed receipt.", expected: "It matches the amount actually charged." },
            ],
            expectedResult:
              "Every surface reports the same order and the same amount.",
          },
          {
            key: "order-invalid-transitions",
            title: "Order states that should be unreachable are refused",
            coverage: "negative",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions:
              "The specified state machine is known, along with at least one transition that must be impossible — shipping a cancelled order is the usual example.",
            steps: [
              { action: "Take an order to a terminal state such as cancelled or refunded.", expected: "It reaches that state." },
              { action: "Attempt to move it onward to a state the specification forbids, through the UI.", expected: "The control is unavailable." },
              { action: "Attempt the same transition directly through the API.", expected: "It is refused." },
              { action: "Reload the order.", expected: "It is still in its terminal state." },
            ],
            expectedResult:
              "Nothing leaves a terminal state, and the state machine is enforced by the server rather than by which buttons are rendered.",
          },
          {
            key: "order-cancel-allowed-window",
            title: "Cancellation is permitted only while the order is still cancellable",
            coverage: "boundary",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "The states from which cancellation is allowed are known.",
            steps: [
              { action: "Cancel an order in the earliest cancellable state.", expected: "It is cancelled." },
              { action: "Attempt to cancel an order already past that point — dispatched, for instance.", expected: "It is refused with an explanation." },
              { action: "Check that a cancelled paid order has its refund raised, per the specification.", expected: "It has." },
            ],
            expectedResult:
              "The cancellation window is enforced at both ends, and cancelling a paid order does not quietly keep the money.",
          },
          {
            key: "order-refund-amount",
            title: "A refund returns exactly the amount that was charged",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A paid order and permission to refund it.",
            steps: [
              { action: "Refund the order in full.", expected: "The refund is accepted." },
              { action: "Compare the refunded amount with the charged amount.", expected: "They are equal, including shipping and tax as specified." },
              { action: "Check the order state and the provider.", expected: "Both show the order refunded, in agreement." },
            ],
            expectedResult:
              "A full refund returns exactly what was taken, and both systems agree it happened.",
          },
          {
            key: "order-no-double-refund",
            title: "An order cannot be refunded twice or beyond the amount paid",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "An order that has already been refunded in full.",
            steps: [
              { action: "Attempt to refund it again through the UI.", expected: "The control is unavailable or the action is refused." },
              { action: "Attempt the same refund directly through the API.", expected: "It is refused." },
              { action: "On a partially refunded order, attempt a further refund exceeding the remaining balance.", expected: "It is refused; only up to the remaining balance is allowed." },
              { action: "Check the provider.", expected: "The total refunded never exceeds the amount charged." },
            ],
            expectedResult:
              "The shop cannot be made to refund more than it took — the mirror image of the double-charge case, and just as expensive.",
          },
        ],
      },
    ],
  },
};
