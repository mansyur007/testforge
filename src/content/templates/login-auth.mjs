// F-47: the "Login & Authentication" starter pack.
//
// Plain ESM data (same reasoning as `src/content/academy/syllabus-los.mjs`):
// `prisma/seed.mjs` and `scripts/templates-selftest.mjs` import it under bare
// `node`, and the TS side gets its types from `src/lib/templates/schema.ts`.
//
// Written to a rule the selftest enforces: **no suite may be positive-only.**
// A starter pack whose only lesson is the happy path teaches the habit the
// feature exists to break, so every suite here carries at least one negative,
// boundary or security case alongside it.

export const LOGIN_AUTH_TEMPLATE = {
  slug: "login-authentication",
  name: "Login & Authentication",
  category: "AUTH",
  order: 10,
  summary:
    "Sign-in, sessions, password reset, lockout and 2FA — with the negative, boundary and security cases teams usually add only after an incident.",
  description: `A starting point for testing any username/password sign-in flow.

Covers the happy path, but the value is in the rest: user-enumeration through
error messages and reset confirmations, tokens that can be replayed, lockout
windows that never expire, and sessions that survive a password change.

**Adapt before you run.** The cases name generic elements ("the email field",
"the sign-in button"). Fill in your own selectors, URLs, timeouts and policy
numbers — the minimum password length and the lockout threshold in particular
are written as *the configured value*, not a specific number.`,
  content: {
    suites: [
      {
        key: "login",
        name: "Login",
        description:
          "The sign-in form itself: valid and invalid credentials, field validation, and what the errors give away.",
        cases: [
          {
            key: "login-valid-credentials",
            title: "Sign in with valid credentials",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "A registered, verified, unlocked account exists.",
            steps: [
              { action: "Open the sign-in page.", expected: "The email and password fields are visible and empty." },
              { action: "Enter the registered email address.", expected: "The value is accepted with no validation error." },
              { action: "Enter the correct password.", expected: "The characters are masked." },
              { action: "Click the sign-in button.", expected: "The user is redirected to the authenticated landing page." },
            ],
            expectedResult:
              "The user is signed in, the landing page shows their account, and a session cookie is set.",
          },
          {
            key: "login-wrong-password",
            title: "Sign in with a registered email and the wrong password",
            coverage: "negative",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "A registered account exists and is not locked.",
            steps: [
              { action: "Open the sign-in page.", expected: "The form is shown." },
              { action: "Enter the registered email and a deliberately wrong password.", expected: "Both values are accepted by field validation." },
              { action: "Click the sign-in button.", expected: "An authentication error is shown." },
            ],
            expectedResult:
              "Sign-in is refused, no session is created, and the email field keeps its value so the user need not retype it.",
          },
          {
            key: "login-unknown-email",
            title: "Sign in with an email address that is not registered",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "The email used is not associated with any account.",
            steps: [
              { action: "Open the sign-in page.", expected: "The form is shown." },
              { action: "Enter an unregistered email and any password.", expected: "Both values pass field validation." },
              { action: "Click the sign-in button.", expected: "An authentication error is shown." },
            ],
            expectedResult: "Sign-in is refused and no session is created.",
          },
          {
            key: "login-no-user-enumeration",
            title: "The error for an unknown email is identical to the error for a wrong password",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "One registered account, and one email address known not to be registered.",
            steps: [
              { action: "Attempt to sign in with the registered email and a wrong password. Record the exact error text, the HTTP status and the response time.", expected: "The attempt is refused." },
              { action: "Attempt to sign in with the unregistered email and any password. Record the same three things.", expected: "The attempt is refused." },
              { action: "Compare the two responses.", expected: "Error text and status code are identical; response times do not differ measurably." },
            ],
            expectedResult:
              "Neither response reveals whether the account exists, so the form cannot be used to enumerate registered users.",
          },
          {
            key: "login-injection-payload",
            title: "An injection payload in the email field is handled safely",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "None.",
            steps: [
              { action: "Enter a SQL payload such as ' OR '1'='1 in the email field with any password, and submit.", expected: "The request is refused as an ordinary invalid login or a validation error." },
              { action: "Enter a script payload such as <script>alert(1)</script> in the email field and submit.", expected: "The value is escaped wherever it is echoed back; no script executes." },
              { action: "Inspect the response body and any error detail.", expected: "No stack trace, SQL fragment, or internal path is disclosed." },
            ],
            expectedResult:
              "Payloads are neither executed nor reflected unescaped, and failures reveal nothing about the backend.",
          },
          {
            key: "login-password-min-length",
            title: "A password at exactly the minimum allowed length is accepted",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "An account whose password is exactly the configured minimum length.",
            steps: [
              { action: "Sign in using that account's exact-minimum-length password.", expected: "The password field accepts every character." },
              { action: "Submit the form.", expected: "Sign-in succeeds." },
            ],
            expectedResult:
              "The minimum length is inclusive — a password of exactly that many characters signs in, rather than being rejected as too short.",
          },
          {
            key: "login-email-max-length",
            title: "An email at the maximum allowed length is handled without truncation",
            coverage: "boundary",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions:
              "An account registered with an email at the maximum length the system allows.",
            steps: [
              { action: "Enter the full-length email address in the sign-in form.", expected: "The field accepts the whole string with no silent truncation." },
              { action: "Enter the correct password and submit.", expected: "Sign-in succeeds." },
              { action: "Open the account/profile screen.", expected: "The stored email matches what was entered, character for character." },
            ],
            expectedResult:
              "The maximum length is inclusive and the value is never truncated on the way in or out.",
          },
          {
            key: "login-empty-fields",
            title: "Submitting the form with both fields empty is blocked",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Open the sign-in page and leave both fields empty.", expected: "The form is shown." },
              { action: "Click the sign-in button.", expected: "Validation messages identify both missing fields." },
            ],
            expectedResult:
              "No request is sent, and the message names which fields are required rather than saying only that something is wrong.",
          },
          {
            key: "login-malformed-email",
            title: "A malformed email address is rejected by field validation",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "None.",
            steps: [
              { action: "Enter a value with no @ (for example user.example.com) and any password.", expected: "A format validation message is shown." },
              { action: "Enter a value with no domain (for example user@) and submit.", expected: "The same format validation applies." },
              { action: "Enter a value with a leading and trailing space around an otherwise valid address.", expected: "The value is trimmed and accepted, not rejected as malformed." },
            ],
            expectedResult:
              "Malformed addresses are caught before a request is sent, while surrounding whitespace is tolerated.",
          },
          {
            key: "login-double-submit",
            title: "The sign-in button shows a loading state and cannot be double-submitted",
            coverage: "usability",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A registered account exists. Throttle the network so the request is observably slow.",
            steps: [
              { action: "Enter valid credentials and click the sign-in button once.", expected: "The button enters a disabled or loading state." },
              { action: "Click the button repeatedly while the request is in flight.", expected: "No further requests are issued." },
              { action: "Inspect the network log.", expected: "Exactly one authentication request was sent." },
            ],
            expectedResult:
              "One click produces one request; the control communicates that work is in progress.",
          },
        ],
      },
      {
        key: "session-logout",
        name: "Session & Logout",
        description:
          "What happens after sign-in: ending a session, restoring the intended destination, and how long a session lives.",
        cases: [
          {
            key: "session-logout",
            title: "Logging out ends the session and returns to the sign-in page",
            coverage: "positive",
            priority: "CRITICAL",
            type: "SMOKE",
            preconditions: "The user is signed in.",
            steps: [
              { action: "Open the account menu and choose Log out.", expected: "The user is redirected to the sign-in page." },
              { action: "Inspect the browser cookies.", expected: "The session cookie is cleared or expired." },
            ],
            expectedResult: "The session is ended on both the client and the server.",
          },
          {
            key: "session-back-after-logout",
            title: "The browser Back button after logout does not restore an authenticated page",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "The user has signed in, visited a page containing account data, and logged out.",
            steps: [
              { action: "Press the browser Back button.", expected: "The authenticated page is not served from cache with its data intact." },
              { action: "Observe the result.", expected: "The user is redirected to the sign-in page, or shown an unauthenticated view." },
              { action: "Force a reload of the same URL.", expected: "The redirect to sign-in still applies." },
            ],
            expectedResult:
              "No account data is recoverable from the browser cache once the session has ended.",
          },
          {
            key: "session-protected-redirect",
            title: "A signed-out user opening a protected URL is redirected to sign-in",
            coverage: "permission",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "No active session in the browser.",
            steps: [
              { action: "Paste a protected URL directly into the address bar and open it.", expected: "The protected content is never rendered, not even briefly." },
              { action: "Observe the destination.", expected: "The sign-in page is shown." },
            ],
            expectedResult:
              "Protected content requires a session, and the unauthenticated request is redirected rather than partially served.",
          },
          {
            key: "session-return-to-target",
            title: "After signing in from a redirect, the user lands on the page they originally requested",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "No active session. A specific protected URL is chosen as the target.",
            steps: [
              { action: "Open the protected URL and be redirected to sign-in.", expected: "The sign-in page is shown." },
              { action: "Sign in with valid credentials.", expected: "Authentication succeeds." },
              { action: "Observe the destination.", expected: "The originally requested URL is shown, not the generic landing page." },
            ],
            expectedResult:
              "The intended destination survives the sign-in detour.",
          },
          {
            key: "session-remember-me",
            title: "Remember me keeps the user signed in after a browser restart",
            coverage: "compatibility",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "The sign-in form offers a Remember me option.",
            steps: [
              { action: "Sign in with Remember me selected.", expected: "Sign-in succeeds." },
              { action: "Close the browser completely and reopen it, then open the application.", expected: "The user is still signed in." },
              { action: "Repeat the whole flow with Remember me cleared.", expected: "After the restart the user is signed out." },
            ],
            expectedResult:
              "The option controls session persistence across browser restarts, in both directions.",
          },
          {
            key: "session-idle-timeout",
            title: "The session expires after the configured idle period",
            coverage: "security",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions:
              "An idle-timeout policy is configured. Use a shortened timeout in a test environment if the production value is impractical.",
            steps: [
              { action: "Sign in and leave the session completely idle for longer than the configured timeout.", expected: "No background activity refreshes the session." },
              { action: "Interact with the page or open a protected URL.", expected: "The user is treated as signed out and redirected to sign-in." },
            ],
            expectedResult:
              "An abandoned session does not stay valid indefinitely.",
          },
        ],
      },
      {
        key: "password-reset",
        name: "Password Reset",
        description:
          "The forgotten-password flow, where the interesting failures are token replay, expiry, and what happens to sessions afterwards.",
        cases: [
          {
            key: "reset-request-link",
            title: "Request a reset link for a registered email address",
            coverage: "positive",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "A registered account with a reachable mailbox.",
            steps: [
              { action: "Open the forgotten-password page and enter the registered email.", expected: "The field accepts the value." },
              { action: "Submit the form.", expected: "A confirmation message is shown." },
              { action: "Check the mailbox.", expected: "A reset email arrives containing a single-use link." },
            ],
            expectedResult:
              "A reset email is delivered and the confirmation does not expose the token.",
          },
          {
            key: "reset-unknown-email-same-response",
            title: "A reset request for an unknown email returns the same confirmation",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "An email address known not to be registered.",
            steps: [
              { action: "Request a reset for a registered email and record the confirmation text and status.", expected: "A confirmation is shown." },
              { action: "Request a reset for the unregistered email and record the same.", expected: "A confirmation is shown." },
              { action: "Compare both responses.", expected: "They are identical." },
              { action: "Check the unregistered mailbox.", expected: "No email is sent." },
            ],
            expectedResult:
              "The flow confirms nothing about whether an address is registered.",
          },
          {
            key: "reset-set-new-password",
            title: "Set a new password using a valid reset link",
            coverage: "positive",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "An unused, unexpired reset link.",
            steps: [
              { action: "Open the reset link.", expected: "The new-password form is shown." },
              { action: "Enter a policy-compliant new password and its confirmation, then submit.", expected: "A success message is shown." },
              { action: "Sign in with the new password.", expected: "Sign-in succeeds." },
              { action: "Attempt to sign in with the old password.", expected: "Sign-in is refused." },
            ],
            expectedResult:
              "The password is changed, the new one works, and the old one stops working.",
          },
          {
            key: "reset-token-single-use",
            title: "A reset link cannot be used a second time",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions: "A reset link that has already been used once to set a password.",
            steps: [
              { action: "Open the same reset link again.", expected: "The new-password form is either not shown or is shown with an invalid-token notice." },
              { action: "If a form is shown, submit a new password.", expected: "The submission is refused." },
              { action: "Verify the password set by the first use still works.", expected: "It does." },
            ],
            expectedResult:
              "The token is consumed on first use, so an intercepted link cannot be replayed.",
          },
          {
            key: "reset-token-expiry",
            title: "An expired reset link is rejected",
            coverage: "negative",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "A reset link older than the configured expiry window (shorten the window in a test environment if needed).",
            steps: [
              { action: "Open the expired link.", expected: "An expired-or-invalid message is shown." },
              { action: "Look for a way forward.", expected: "The page offers to send a fresh link." },
            ],
            expectedResult:
              "Expired tokens cannot set a password, and the user is given a route to recover rather than a dead end.",
          },
          {
            key: "reset-password-policy",
            title: "A new password that fails the password policy is rejected",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A valid, unused reset link.",
            steps: [
              { action: "Enter a password one character shorter than the configured minimum and submit.", expected: "A policy message is shown and the password is not changed." },
              { action: "Enter a password that fails each other configured rule in turn (character classes, common-password list, reuse of the current password).", expected: "Each is refused with a message naming the rule it broke." },
              { action: "Enter a compliant password and submit.", expected: "The password is changed." },
            ],
            expectedResult:
              "Every policy rule is enforced server-side, and the messages say which rule failed.",
          },
          {
            key: "reset-password-mismatch",
            title: "Mismatched password and confirmation is rejected",
            coverage: "negative",
            priority: "LOW",
            type: "FUNCTIONAL",
            preconditions: "A valid, unused reset link.",
            steps: [
              { action: "Enter a compliant password and a different confirmation value, then submit.", expected: "A mismatch message is shown." },
              { action: "Verify the account state.", expected: "The password is unchanged and the reset token is still usable." },
            ],
            expectedResult:
              "A typo in the confirmation neither changes the password nor burns the token.",
          },
          {
            key: "reset-invalidates-sessions",
            title: "Existing sessions are invalidated after a password reset",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "The account is signed in on a second browser or device while the reset is performed on the first.",
            steps: [
              { action: "With the account signed in on browser B, complete a password reset in browser A.", expected: "The reset succeeds in browser A." },
              { action: "In browser B, interact with the page or open a protected URL.", expected: "Browser B is signed out and redirected to sign-in." },
            ],
            expectedResult:
              "Resetting a password ends sessions the user may not control — which is the entire point of resetting it after a compromise.",
          },
        ],
      },
      {
        key: "account-lockout",
        name: "Account Lockout",
        description:
          "Brute-force protection: when it triggers, when it releases, and what it discloses.",
        cases: [
          {
            key: "lockout-after-threshold",
            title: "The account locks after the configured number of failed attempts",
            coverage: "negative",
            priority: "HIGH",
            type: "SECURITY",
            preconditions:
              "A registered, unlocked account. The lockout threshold is known; call it N.",
            steps: [
              { action: "Attempt to sign in with the wrong password N times in a row.", expected: "Each attempt is refused." },
              { action: "Attempt to sign in once more, this time with the CORRECT password.", expected: "Sign-in is refused because the account is locked, not because the password is wrong." },
            ],
            expectedResult:
              "The account is locked at the configured threshold, and a correct password does not bypass the lock.",
          },
          {
            key: "lockout-last-allowed-attempt",
            title: "The last attempt before the threshold still succeeds with a correct password",
            coverage: "boundary",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "A registered, unlocked account with a known threshold N.",
            steps: [
              { action: "Attempt to sign in with the wrong password N-1 times.", expected: "Each attempt is refused and the account remains unlocked." },
              { action: "Attempt to sign in with the correct password.", expected: "Sign-in succeeds." },
            ],
            expectedResult:
              "The threshold is off-by-one correct: locking happens on the Nth failure, not the (N-1)th.",
          },
          {
            key: "lockout-window-expires",
            title: "The account unlocks after the lockout window expires",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "An account locked by failed attempts, and a known lockout duration.",
            steps: [
              { action: "Immediately after locking, attempt to sign in with the correct password.", expected: "Sign-in is refused." },
              { action: "Wait until just before the lockout window elapses and try again.", expected: "Sign-in is still refused." },
              { action: "Wait until after the window has elapsed and try again with the correct password.", expected: "Sign-in succeeds." },
            ],
            expectedResult:
              "The lock releases on schedule — it is a delay, not a permanent lockout requiring support.",
          },
          {
            key: "lockout-no-account-disclosure",
            title: "The lockout response does not reveal whether the account exists",
            coverage: "security",
            priority: "MEDIUM",
            type: "SECURITY",
            preconditions: "An email address known not to be registered.",
            steps: [
              { action: "Send the lockout threshold number of failed sign-in attempts against the unregistered email.", expected: "Each is refused." },
              { action: "Compare the final response with the lockout response for a real account.", expected: "The behaviour does not distinguish the two — either both report a lock or neither does." },
            ],
            expectedResult:
              "Lockout behaviour cannot be used as an oracle for which addresses are registered.",
          },
          {
            key: "lockout-counter-reset",
            title: "A successful sign-in resets the failed-attempt counter",
            coverage: "negative",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions: "A registered, unlocked account with a known threshold N.",
            steps: [
              { action: "Fail to sign in N-1 times.", expected: "The account remains unlocked." },
              { action: "Sign in successfully with the correct password, then sign out.", expected: "Sign-in succeeds." },
              { action: "Fail to sign in N-1 times again.", expected: "The account is still not locked, proving the counter restarted." },
            ],
            expectedResult:
              "Failed attempts do not accumulate across successful sign-ins.",
          },
        ],
      },
      {
        key: "two-factor",
        name: "Two-Factor Authentication",
        description:
          "The second factor: valid and invalid codes, the time-step boundary, recovery codes, and whether the challenge can be skipped.",
        cases: [
          {
            key: "totp-valid-code",
            title: "Sign in with a valid authenticator code",
            coverage: "positive",
            priority: "CRITICAL",
            type: "FUNCTIONAL",
            preconditions: "An account with two-factor authentication enrolled and enabled.",
            steps: [
              { action: "Sign in with the correct email and password.", expected: "The two-factor challenge is shown instead of the landing page." },
              { action: "Enter the current code from the authenticator app and submit.", expected: "The code is accepted." },
            ],
            expectedResult:
              "Sign-in completes only after the second factor, and the session is created at that point, not before.",
          },
          {
            key: "totp-invalid-code",
            title: "An incorrect authenticator code is rejected",
            coverage: "negative",
            priority: "HIGH",
            type: "FUNCTIONAL",
            preconditions: "An enrolled account, sitting at the two-factor challenge.",
            steps: [
              { action: "Enter a code of the right length but wrong digits, then submit.", expected: "The code is refused and no session is created." },
              { action: "Enter a code of the wrong length and submit.", expected: "Field validation refuses it." },
              { action: "Enter the correct current code.", expected: "Sign-in completes." },
            ],
            expectedResult:
              "Only the correct code completes sign-in, and a failed attempt does not consume the challenge.",
          },
          {
            key: "totp-previous-time-step",
            title: "A code from the previous time step is accepted within the grace window",
            coverage: "boundary",
            priority: "MEDIUM",
            type: "FUNCTIONAL",
            preconditions:
              "An enrolled account. The implementation's accepted clock drift (typically one time step either side) is known.",
            steps: [
              { action: "Read a code from the authenticator and wait until the app has rolled to the next code.", expected: "A new code is displayed." },
              { action: "Submit the PREVIOUS code, still within the configured grace window.", expected: "It is accepted." },
              { action: "Submit a code from well outside the grace window (for example two minutes old).", expected: "It is refused." },
            ],
            expectedResult:
              "Small clock drift is tolerated without accepting codes indefinitely.",
          },
          {
            key: "totp-recovery-code-single-use",
            title: "A recovery code cannot be used twice",
            coverage: "security",
            priority: "HIGH",
            type: "SECURITY",
            preconditions: "An enrolled account with a list of unused recovery codes.",
            steps: [
              { action: "At the two-factor challenge, choose to use a recovery code and enter an unused one.", expected: "Sign-in completes." },
              { action: "Sign out, then sign in again and submit the SAME recovery code.", expected: "It is refused as already used." },
              { action: "Submit a different, unused recovery code.", expected: "Sign-in completes." },
            ],
            expectedResult:
              "Each recovery code is consumed on first use, so a stolen list entry works at most once.",
          },
          {
            key: "totp-challenge-not-skippable",
            title: "The two-factor challenge cannot be skipped by navigating directly to a protected URL",
            coverage: "security",
            priority: "CRITICAL",
            type: "SECURITY",
            preconditions:
              "An enrolled account, sitting at the two-factor challenge with the password already accepted.",
            steps: [
              { action: "Without completing the challenge, paste a protected URL into the address bar and open it.", expected: "The protected content is not rendered." },
              { action: "Observe the result.", expected: "The user is returned to the two-factor challenge or to sign-in." },
              { action: "Inspect the cookies at this point.", expected: "No fully authenticated session cookie has been issued." },
            ],
            expectedResult:
              "A password alone never grants access to protected content on a two-factor account.",
          },
        ],
      },
    ],
  },
};
