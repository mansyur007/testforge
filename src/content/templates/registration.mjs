// F-47: the "Registration & Onboarding" starter pack.
//
// The sign-up half of the auth story. Where the login pack's interesting
// failures are about tokens and sessions, this one's are about validation
// boundaries and what a public form leaks — a registration form is the one
// endpoint anonymous strangers are invited to hammer.

export const REGISTRATION_TEMPLATE = {
  slug: "registration-onboarding",
  name: "Registration & Onboarding",
  category: "ONBOARDING",
  order: 20,
  summary:
    "Sign-up, field validation, email verification and first-run onboarding — including the boundary and abuse cases a public form invites.",
  description: `A starting point for testing account creation and the first session that follows it.

The sign-up form is usually the only endpoint an unauthenticated stranger is
*invited* to submit to, so this pack leans on validation boundaries, duplicate
handling, and what the responses disclose about who is already registered.

**Adapt before you run.** Field names, the password policy and the verification
window are written as *the configured value* rather than specific numbers — fill
in your own before running these.`,
  content: {
    suites: [
      {
        key: "sign-up-form",
        name: "Sign-Up Form",
        description:
          "Creating an account: the happy path, and what happens when the form is submitted in ways the design did not intend.",
        cases: [
          {
            key: "signup-valid",
            title: "Create an account with valid details",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "The email used is not registered to any account.",
            steps: [
              { action: "Open the sign-up page.", expected: "Every required field is visible and empty." },
              { action: "Fill in every required field with valid values.", expected: "No validation errors are shown." },
              { action: "Submit the form.", expected: "The account is created and the next step (verification or onboarding) is shown." },
            ],
            expectedResult:
              "An account exists for the submitted email and the user is moved on to the next step rather than left on the form.",
          },
          {
            key: "signup-required-fields",
            title: "Submitting with every field empty names each missing field",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Open the sign-up page and submit without entering anything.", expected: "The form is not submitted." },
              { action: "Read the messages.", expected: "Each required field is individually identified." },
            ],
            expectedResult:
              "The user is told which fields are missing, not merely that something is wrong.",
          },
          {
            key: "signup-terms-required",
            title: "Sign-up is refused until the terms checkbox is accepted",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The form has a terms/privacy acceptance control.",
            steps: [
              { action: "Fill in every field correctly but leave the terms checkbox unticked, then submit.", expected: "The form is refused with a message pointing at the checkbox." },
              { action: "Tick the checkbox and submit again.", expected: "The account is created." },
            ],
            expectedResult:
              "Acceptance is genuinely required and is not merely decorative.",
          },
          {
            key: "signup-server-side-validation",
            title: "Validation still applies when the client-side checks are bypassed",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions:
              "Access to the browser devtools or an HTTP client, to submit a request the form UI would not allow.",
            steps: [
              { action: "Submit the registration request directly with an empty required field.", expected: "The server refuses it." },
              { action: "Submit it with a password that violates the policy.", expected: "The server refuses it." },
              { action: "Submit it with a role or permission field the form never renders (for example role=admin).", expected: "The field is ignored; the created account has the default role." },
            ],
            expectedResult:
              "Every rule the form displays is enforced again on the server, and unexpected fields cannot escalate the new account.",
          },
          {
            key: "signup-double-submit",
            title: "Submitting the form twice does not create two accounts",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "Throttle the network so the request is observably slow.",
            steps: [
              { action: "Fill in valid details and click Sign up.", expected: "The button enters a disabled or loading state." },
              { action: "Click repeatedly while the request is in flight.", expected: "No further requests are sent." },
              { action: "Query the accounts for that email.", expected: "Exactly one exists." },
            ],
            expectedResult:
              "One submission produces one account, whatever the user does with the mouse.",
          },
          {
            key: "signup-rate-limited",
            title: "Repeated sign-up attempts from one source are rate limited",
            coverage: "security",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions:
              "A rate-limit policy is configured. Use a test environment where the threshold is reachable.",
            steps: [
              { action: "Submit valid registrations for distinct new emails in rapid succession from one client.", expected: "Early requests succeed." },
              { action: "Continue past the configured threshold.", expected: "Further requests are refused or challenged rather than creating accounts." },
            ],
            expectedResult:
              "The form cannot be scripted to create unlimited accounts.",
          },
          {
            key: "signup-password-visible-toggle",
            title: "The password field masks input and its reveal toggle works",
            coverage: "usability",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Type a password into the password field.", expected: "Characters are masked." },
              { action: "Activate the reveal control.", expected: "The password is shown in clear text." },
              { action: "Activate it again.", expected: "The password is masked once more." },
            ],
            expectedResult:
              "The user can check what they typed without the password being visible by default.",
          },
          {
            key: "signup-keyboard-only",
            title: "The whole form can be completed with the keyboard alone",
            coverage: "usability",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Place focus on the first field and move through the form using Tab only.", expected: "Focus reaches every field and control in a sensible order, with a visible focus indicator throughout." },
              { action: "Complete every field and submit using Enter.", expected: "The form submits." },
              { action: "Trigger a validation error and Tab through again.", expected: "The error message is associated with its field, not orphaned." },
            ],
            expectedResult:
              "No part of registration requires a pointing device.",
          },
          {
            key: "signup-cancel-midway",
            title: "Abandoning the form part-way creates no account",
            coverage: "negative",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Fill in some but not all fields, then navigate away without submitting.", expected: "No submission occurs." },
              { action: "Query the accounts for that email.", expected: "None exists." },
            ],
            expectedResult:
              "A partially filled form leaves no trace in the account store.",
          },
        ],
      },
      {
        key: "field-validation",
        name: "Field Validation",
        description:
          "The boundaries. Every rule the form advertises, tested at its edge rather than in its comfortable middle.",
        cases: [
          {
            key: "validation-email-format",
            title: "Malformed email addresses are rejected and valid unusual ones are not",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Enter values with no @, no domain, and a double @, submitting each.", expected: "Each is refused with a format message." },
              { action: "Enter a valid address containing a plus tag (user+tag@example.com).", expected: "It is ACCEPTED — a plus is legal and is commonly used for per-service aliases." },
              { action: "Enter a valid address on a long multi-label domain.", expected: "It is accepted." },
            ],
            expectedResult:
              "Validation is strict about genuinely malformed input without rejecting legal addresses.",
          },
          {
            key: "validation-password-min",
            title: "Password length is enforced exactly at the boundary",
            coverage: "boundary",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "The configured minimum length is known; call it N.",
            steps: [
              { action: "Enter a password of N-1 characters and submit.", expected: "It is refused as too short." },
              { action: "Enter a password of exactly N characters and submit.", expected: "It is accepted." },
            ],
            expectedResult:
              "The minimum is inclusive: N passes, N-1 does not. No off-by-one either way.",
          },
          {
            key: "validation-password-max",
            title: "A very long password is either accepted whole or refused clearly, never truncated",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions: "None.",
            steps: [
              { action: "Register with a password far longer than any documented maximum (for example 200 characters).", expected: "Either the account is created, or the form refuses it with a stated maximum." },
              { action: "If the account was created, sign in with the full password.", expected: "Sign-in succeeds." },
              { action: "Attempt to sign in with the first N characters of it.", expected: "Sign-in is REFUSED — a success here proves the password was silently truncated." },
            ],
            expectedResult:
              "A password is never silently shortened, which would quietly weaken every long password to its prefix.",
          },
          {
            key: "validation-password-policy",
            title: "Each password-composition rule is enforced and named",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The configured composition rules are known.",
            steps: [
              { action: "Submit a password violating exactly one rule, for each configured rule in turn.", expected: "Each is refused with a message naming the rule that failed." },
              { action: "Submit a password on a common-password list, if one is configured.", expected: "It is refused." },
              { action: "Submit a compliant password.", expected: "It is accepted." },
            ],
            expectedResult:
              "Rules are enforced individually and the message says which one broke.",
          },
          {
            key: "validation-name-boundaries",
            title: "Name fields accept their full allowed length and non-ASCII characters",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The configured maximum name length is known.",
            steps: [
              { action: "Enter a name of exactly the maximum length and submit.", expected: "It is accepted and stored in full." },
              { action: "Enter a name one character longer.", expected: "It is refused with a stated limit, or the field stops accepting input at the limit." },
              { action: "Enter a name containing accents, non-Latin script and an apostrophe.", expected: "It is accepted and displays correctly afterwards, unmangled." },
            ],
            expectedResult:
              "The limit is inclusive and correct, and real people's names are not rejected or corrupted.",
          },
          {
            key: "validation-whitespace-trim",
            title: "Leading and trailing whitespace is trimmed rather than stored",
            coverage: "boundary",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Register with a leading and trailing space around the email address.", expected: "The account is created." },
              { action: "Sign in with the address typed without spaces.", expected: "Sign-in succeeds, proving the stored value was trimmed." },
              { action: "Submit a name consisting only of spaces.", expected: "It is refused as empty." },
            ],
            expectedResult:
              "Surrounding whitespace never becomes part of a stored identifier, and a whitespace-only value counts as empty.",
          },
          {
            key: "validation-xss-payload",
            title: "Script payloads in text fields are escaped wherever they are echoed",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "None.",
            steps: [
              { action: "Register with a name containing a script payload such as <script>alert(1)</script>.", expected: "Either the value is refused, or the account is created." },
              { action: "If created, visit every screen that displays the name — profile, header, admin user list, any email sent.", expected: "The payload renders as literal text; no script executes anywhere." },
            ],
            expectedResult:
              "Stored input is escaped at every render point, including surfaces the registering user never sees themselves.",
          },
        ],
      },
      {
        key: "email-verification",
        name: "Email Verification",
        description:
          "Proving the address belongs to whoever registered — and the token handling that makes that proof worth anything.",
        cases: [
          {
            key: "verify-happy-path",
            title: "Verify an address using the emailed link",
            coverage: "positive",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "A freshly registered, unverified account with a reachable mailbox.",
            steps: [
              { action: "Open the mailbox and find the verification email.", expected: "It has arrived and contains a link." },
              { action: "Open the link.", expected: "A confirmation is shown." },
              { action: "Check the account state.", expected: "It is marked verified." },
            ],
            expectedResult:
              "The account becomes verified and whatever verification gates is now reachable.",
          },
          {
            key: "verify-unverified-blocked",
            title: "An unverified account cannot reach what verification is supposed to gate",
            coverage: "permission",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "A registered but unverified account.",
            steps: [
              { action: "Attempt to sign in with correct credentials.", expected: "The system either refuses, or signs in to a limited state — whichever the product specifies." },
              { action: "Attempt to reach a feature that requires verification, by URL.", expected: "It is refused." },
            ],
            expectedResult:
              "Verification actually gates something; an unverified account cannot walk past it by typing a URL.",
          },
          {
            key: "verify-token-single-use",
            title: "A verification link cannot be used twice",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "A verification link that has already been used once.",
            steps: [
              { action: "Open the same link a second time.", expected: "An already-used or invalid message is shown." },
              { action: "Check the account state.", expected: "It remains verified and is otherwise unchanged." },
            ],
            expectedResult:
              "Replaying the link is inert rather than an error the user must resolve.",
          },
          {
            key: "verify-token-expiry",
            title: "An expired verification link is rejected and can be reissued",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions:
              "A verification link older than the configured expiry window.",
            steps: [
              { action: "Open the expired link.", expected: "An expired message is shown." },
              { action: "Look for a way forward.", expected: "The page offers to send a fresh link." },
              { action: "Request a new link and use it.", expected: "The account is verified." },
            ],
            expectedResult:
              "Expiry is enforced without stranding the user.",
          },
          {
            key: "verify-tampered-token",
            title: "A tampered or guessed verification token is rejected",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "A valid verification link, for reference.",
            steps: [
              { action: "Alter one character of the token in the URL and open it.", expected: "It is refused." },
              { action: "Open the verification URL with an obviously sequential or guessable token value.", expected: "It is refused." },
              { action: "Check the target account.", expected: "It remains unverified." },
            ],
            expectedResult:
              "Tokens are unguessable and are validated, not merely parsed — nobody verifies someone else's address.",
          },
          {
            key: "verify-resend-does-not-leak",
            title: "Resending verification does not confirm whether an address is registered",
            coverage: "security",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions: "One registered address and one that is not registered.",
            steps: [
              { action: "Request a resend for the registered address and record the response.", expected: "A confirmation is shown." },
              { action: "Request a resend for the unregistered address and record the response.", expected: "The same confirmation is shown." },
              { action: "Compare the two.", expected: "They are identical." },
            ],
            expectedResult:
              "The resend endpoint cannot be used to test which addresses have accounts.",
          },
        ],
      },
      {
        key: "duplicate-conflict",
        name: "Duplicate & Conflict",
        description:
          "What happens when the address is already taken — the case where privacy and helpfulness pull against each other.",
        cases: [
          {
            key: "duplicate-existing-email",
            title: "Registering with an already-registered address does not create a second account",
            coverage: "negative",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "An account already exists for the address used.",
            steps: [
              { action: "Submit the registration form with the existing address.", expected: "No new account is created." },
              { action: "Query the accounts for that address.", expected: "Exactly one exists, and its password is unchanged." },
            ],
            expectedResult:
              "The address stays unique and the existing account is untouched.",
          },
          {
            key: "duplicate-no-disclosure",
            title: "The duplicate-address response does not disclose that the account exists",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "One registered address and one that is not registered.",
            steps: [
              { action: "Register with the unregistered address and record the response text, status and timing.", expected: "The flow proceeds." },
              { action: "Register with the already-registered address and record the same.", expected: "The flow appears to proceed identically." },
              { action: "Compare the two, and check the mailbox of the existing account.", expected: "Responses match; the existing account receives a 'someone tried to register with your address' notice instead of a new account." },
            ],
            expectedResult:
              "A stranger cannot use the public sign-up form to discover who has an account — the disclosure goes to the address owner instead.",
          },
          {
            key: "duplicate-case-insensitive",
            title: "Addresses differing only in letter case are treated as the same account",
            coverage: "boundary",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "An account registered as user@example.com.",
            steps: [
              { action: "Attempt to register USER@EXAMPLE.COM.", expected: "It is treated as a duplicate, not as a new account." },
              { action: "Sign in with User@Example.com and the original password.", expected: "Sign-in succeeds." },
            ],
            expectedResult:
              "The local part is matched case-insensitively, so one person cannot end up with several accounts they cannot tell apart.",
          },
        ],
      },
      {
        key: "first-run",
        name: "First-Run Onboarding",
        description:
          "The first authenticated session: whatever the product asks for before it lets someone work.",
        cases: [
          {
            key: "onboarding-completes",
            title: "Completing onboarding lands the user in the product",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A newly verified account that has not been through onboarding.",
            steps: [
              { action: "Sign in for the first time.", expected: "The onboarding flow is shown." },
              { action: "Complete every step with valid input.", expected: "Each step accepts and advances." },
              { action: "Finish the flow.", expected: "The main product view is shown." },
              { action: "Sign out and back in.", expected: "Onboarding is NOT shown again." },
            ],
            expectedResult:
              "Onboarding runs once, its answers persist, and it does not reappear on later sessions.",
          },
          {
            key: "onboarding-resume",
            title: "Abandoning onboarding half-way resumes rather than restarts",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A new account that has not been through onboarding.",
            steps: [
              { action: "Begin onboarding and complete the first step or two.", expected: "Progress advances." },
              { action: "Close the browser without finishing.", expected: "The session ends mid-flow." },
              { action: "Sign in again.", expected: "Onboarding resumes at the step reached, with earlier answers retained." },
            ],
            expectedResult:
              "Partial progress survives an interruption; the user does not retype what they already answered.",
          },
          {
            key: "onboarding-skip-guard",
            title: "Onboarding cannot be skipped by navigating straight to a product URL",
            coverage: "permission",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions: "A signed-in account that has not completed onboarding.",
            steps: [
              { action: "While onboarding is pending, paste a main product URL into the address bar.", expected: "The product view is not shown." },
              { action: "Observe the result.", expected: "The user is returned to onboarding, or the mandatory steps are enforced before the view renders." },
            ],
            expectedResult:
              "Whatever onboarding collects is genuinely required, not merely suggested.",
          },
        ],
      },
    ],
  },
};
