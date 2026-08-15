import type { Lesson } from "../../types";

export const pageObjects: Lesson = {
  slug: "page-objects",
  title: "Page objects, and when they hurt",
  summary:
    "Structure that pays off, structure that becomes a second application.",
  minutes: 14,
  status: "published",
  body: `
## The problem is real before the pattern is

Four tests into a suite, this has happened:

~~~ts
test("creates a case", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TF_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TF_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // ... four lines of actual test
});
~~~

Those first five lines are now in every test file you own. The day the login form
gains a "Workspace" field, you edit forty files. That is the cost page objects
exist to remove, and it is worth being precise about what the cost actually is:
**not duplication for its own sake, but the number of places one UI change forces
you to touch.**

## The pattern, minimally

A page object is a class that owns the locators and the actions for one screen.
Nothing more:

~~~ts
// pages/login.page.ts
import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Email");
    this.password = page.getByLabel("Password");
    this.submit = page.getByRole("button", { name: "Sign in" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
~~~

~~~ts
test("creates a case", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(process.env.TF_EMAIL!, process.env.TF_PASSWORD!);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // ... the actual test
});
~~~

The locators are assigned in the constructor, and that is safe for the reason the
locators lesson gave: **a locator is a description, not a found element.** Nothing
is searched at construction time, so a page object built before the page exists
works fine, and one held across a re-render never goes stale.

## The rule that keeps page objects useful

**A page object exposes what a user can do. It does not assert.**

~~~ts
// no
async assertLoginSucceeded() {
  await expect(this.page.getByRole("heading", { name: "Projects" })).toBeVisible();
}
~~~

Move assertions into page objects and two things go wrong. The test stops saying
what it verifies — \`await login.assertLoginSucceeded()\` tells a reader nothing
about what "succeeded" means — and you end up with a growing menu of
\`assertX\` methods, most used once, because every test wants a slightly different
check.

Keep the *expectation* in the test, where a reader can see the whole claim:

~~~ts
await login.signIn(email, password);
await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
~~~

The compromise worth allowing is a **getter**, not an assertion:

~~~ts
get errorMessage() {
  return this.page.getByRole("alert");
}
~~~

~~~ts
await expect(login.errorMessage).toHaveText("Incorrect email or password");
~~~

The page object owns *where the error lives*; the test owns *what it should say*.
That division is the whole discipline, and almost every page-object mess comes
from crossing it.

## Where it hurts

Page objects have a failure mode, and it is not rare. The suite becomes a second
application — one with no tests of its own, no users, and a maintenance bill that
nobody budgeted.

**Symptom 1: methods that are one line with a worse name.**

~~~ts
async clickSaveButton() {
  await this.saveButton.click();
}
~~~

This is indirection with no abstraction. The reader now has to open another file
to learn what \`clickSaveButton\` does, and learns it clicks the save button.
Expose the locator and let the test click it.

**Symptom 2: methods with a boolean parameter.**

~~~ts
await casePage.save(true, false, "TC-12");
~~~

Nobody can read that at the call site. Two of the three arguments exist because
one method is trying to serve three different tests. Write three named methods,
or fewer.

**Symptom 3: page objects that mirror components rather than screens.**
\`ButtonComponent\`, \`InputComponent\`, \`TableCellComponent\` — a wrapper layer over
an API that was already good. Playwright's locators are the abstraction; another
one on top pays nothing.

**Symptom 4: inheritance.** \`BasePage\` → \`AuthenticatedPage\` → \`ProjectPage\` →
\`CasePage\`, and finding where a locator is defined means climbing four files.
Composition — a page object holding a \`Nav\` object — stays readable at ten times
the size.

**Symptom 5: chaining that lies.** \`login.signIn().goToProjects().openCase()\`
looks tidy and hides the fact that each step can fail, at which point the stack
trace points at a chain rather than a step.

The test to apply: **would a new team member reading the test file alone
understand what is being verified?** If understanding one test means opening three
page objects, the structure is costing more than the duplication did.

## Fixtures are usually the better tool

Playwright has its own answer to setup, and it composes better than a base class:

~~~ts
// fixtures.ts
import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

export const test = base.extend<{ loginPage: LoginPage; signedInPage: Page }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signedInPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(process.env.TF_EMAIL!, process.env.TF_PASSWORD!);
    await use(page);
  },
});

export { expect } from "@playwright/test";
~~~

~~~ts
import { test, expect } from "../fixtures";

test("creates a case", async ({ signedInPage }) => {
  // already signed in
});
~~~

The setup is now declared by *asking for it in the test signature*, it runs only
for tests that ask, and teardown after \`use()\` is guaranteed even when the test
fails. That last property is what makes fixtures better than \`beforeEach\` for
anything that creates data — and it is where the next lesson picks up.

**Signing in through the UI in every test is still slow.** The standard fix is
\`storageState\`: sign in once in a setup project, save the cookies to a file, and
have every test start authenticated. The login flow itself still gets one real
test — the one that actually exercises the form.

## How much structure, and when

A reasonable default, in order:

1. **Test file only.** Under about five tests, locators inline are clearer than
   any structure. Do not build a framework for three tests.
2. **Extract the repeated flow** — usually login — into a fixture, the moment it
   is in three files.
3. **Add a page object per screen** when a screen's locators appear in several
   files, or when one screen has enough elements that inline locators bury the
   test.
4. **Split further only on evidence**: a component object for a genuinely reused
   widget (a date picker, a data table), not because a folder felt empty.

Structure earned by a real repetition is almost always right. Structure added in
advance, because a tutorial said to, is what becomes the second application.

## Naming, so the suite survives you

Two conventions that cost nothing now and a sprint later:

- \`pages/login.page.ts\`, one class per screen, method names in the user's
  language — \`signIn\`, \`createCase\`, \`filterByStatus\` — not the DOM's.
- **Test names still carry the case id**, whatever structure sits underneath:
  \`test("TC-SHOP-12 a valid login lands on the dashboard")\`. The programming lesson
  planted this and the capstone depends on it; refactoring into page objects is
  exactly the moment people accidentally rewrite test titles and break the
  matching.

## Where TestForge fits

Page objects change how a failure reads. Without them, forty red tests after a
login change tell you forty things are broken; with them, the same change breaks
one file and the run history shows a single locator fix rather than a cliff.

That distinction matters when your runs land in TestForge, because a run where
half the cases go red at once is either a real regression or a suite maintenance
event, and the two demand completely different responses. Structure that
concentrates a UI change into one place is what keeps that signal readable — and
it is the same argument the locators lesson made about not recording a locator
fix as a defect found.

**Next:** test data and fixtures — independent tests, seeded state, and cleaning
up after yourself so the suite passes in any order.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Why should a page object expose the error-message locator rather than an assertLoginFailed() method?",
      choices: [
        {
          id: "a",
          text: "Assertions cannot be called from outside a test file in Playwright",
        },
        {
          id: "b",
          text: "The test should state what it verifies; hiding the claim behind a method name makes the test unreadable and breeds a menu of near-identical assert methods",
          correct: true,
        },
        {
          id: "c",
          text: "Locators are faster than assertions because they do not poll",
        },
        {
          id: "d",
          text: "expect() only retries when it is called at the top level of a test",
        },
      ],
      explanation:
        "The division is that the page object owns where a thing lives and the test owns what it should say. assertLoginFailed() tells a reader nothing about what failure looks like, and because every test wants a slightly different check you accumulate assertLoginFailedWithBadPassword, assertLoginFailedWithLockedAccount, and so on — most used once. Exposing the locator keeps the whole claim visible at the call site: expect(login.errorMessage).toHaveText(\"Incorrect email or password\"). Nothing technical prevents asserting inside a page object; expect works and retries perfectly well there, which is exactly why the discipline has to be a deliberate choice.",
    },
    {
      id: "q2",
      stem: "A suite signs in through the login form at the start of all 60 tests, adding about four seconds each. What is the standard fix?",
      choices: [
        {
          id: "a",
          text: "Increase the number of parallel workers so the total wall time drops",
        },
        {
          id: "b",
          text: "Sign in once in a setup project, save storageState, and start every test authenticated — keeping one real test for the login form itself",
          correct: true,
        },
        {
          id: "c",
          text: "Move the sign-in into a BasePage class that every page object extends",
        },
        {
          id: "d",
          text: "Replace the sign-in with waitForTimeout so the tests do not depend on the form",
        },
      ],
      explanation:
        "storageState removes the repeated work rather than hiding it: authenticate once, persist the cookies, and every test begins signed in — while the login flow keeps a single test that genuinely exercises the form, because that is a feature someone should still be verifying. More workers reduce wall time but keep paying the same four seconds of machine time per test and add load that makes timing-sensitive tests worse. A BasePage moves the same slow flow into an inheritance chain, which is the fifth symptom in this lesson rather than a fix. And the last option deletes the sign-in without replacing it, leaving tests on an unauthenticated page.",
    },
    {
      id: "q3",
      stem: "Which of these are signs that page objects have become a second application to maintain?",
      multi: true,
      choices: [
        {
          id: "a",
          text: "Methods like clickSaveButton() that wrap a single click",
          correct: true,
        },
        {
          id: "b",
          text: "A four-level inheritance chain: BasePage → AuthenticatedPage → ProjectPage → CasePage",
          correct: true,
        },
        {
          id: "c",
          text: "A page object exposing a locator that several test files use",
        },
        {
          id: "d",
          text: "Methods with boolean parameters, called as save(true, false, \"TC-12\")",
          correct: true,
        },
      ],
      explanation:
        "One-line wrappers are indirection with no abstraction — a reader opens another file to learn that clickSaveButton clicks the save button. Deep inheritance means finding where a locator is defined requires climbing several files, and composition stays readable at ten times the size. Boolean parameters are unreadable at the call site and usually mean one method is serving three tests that wanted three named methods. The shared locator is the pattern working as intended: that is exactly the repetition page objects exist to concentrate, so that a UI change touches one file rather than forty.",
    },
  ],
};
