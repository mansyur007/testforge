# Graph Report - .  (2026-07-16)

## Corpus Check
- 332 files · ~177,502 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1668 nodes · 4727 edges · 120 communities (82 shown, 38 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.78)
- Token cost: 124,139 input · 0 output

## Community Hubs (Navigation)
- API v1 REST Routes
- Comments & Attachments
- Report Schedules & Pages
- Onboarding & Team Admin
- Roles & Saved Views
- Case/Plan/Dashboard Pages
- Architecture Audit & Data Model
- Notifications & Delivery
- Dashboard & Run Pages
- Bulk Case Operations
- Auth Pages (Login/Reset)
- Issue Tracker Integrations
- Requirements & Traceability
- Runs & Result Submission
- Cypress Reporter Package
- Two-Factor Auth (TOTP)
- Playwright Reporter Package
- Password Auth & Lockout
- Email Verify & CSV Import
- Case Actions (Clone/Move)
- Issue Provider Clients (GitHub/GitLab)
- Result Parsers (Mocha/NUnit)
- TypeScript Config
- Help Center Content
- Runtime Dependencies
- Dev Dependencies
- Projects & Milestones
- Attachment Storage
- CLI Package Manifest
- Shared Steps & Webhooks
- Case Review Workflow
- pytest Plugin Client
- Test Plans & Runs
- TestLink Importer
- Playwright Reporter Impl
- Project Members RBAC
- OIDC SSO Providers
- Team Invitations
- Issue Creation from Results
- Custom Result Statuses
- Reporters & Results API (F-11/F-12)
- E2E History/Flaky Specs
- Cypress Reporter Impl
- Custom Fields
- TestRail Importer
- Dashboard/Params E2E Specs
- Configurations Admin
- Dashboards Builder
- Qase Importer
- Integrations E2E & Crypto
- Account & Password Change
- API Keys
- Environments Admin
- NPM Scripts
- Run Comparison
- Signup Form
- TOTP Self-Test Script
- Case History UI
- Monorepo Workspaces
- JUnit Ingest & API-Key Auth
- Landing / Home Page
- Cucumber Parser
- Bulk Copy/Reorder E2E
- TOTP Lib & 2FA E2E
- Comments E2E
- JUnit Upload Script
- Issue Status Sync
- Root Layout & Fonts
- 2FA Login Flow
- TRX Parser
- Custom Status/Role E2E
- Mock OIDC E2E
- Importers E2E
- Reporters/CLI E2E
- Result Formats E2E
- Review E2E
- CLI Uploader
- API Docs Page
- Command Palette
- Attachments E2E
- Estimates/Forecast E2E
- Scheduled Reports E2E
- Search E2E
- Smoke E2E
- ESLint Config
- App Icon / Brand Mark
- Custom Fields E2E
- Environments E2E
- Prisma Global Setup
- Help Center E2E
- Markdown E2E
- Plans E2E
- Requirements E2E
- Run Comparison E2E
- DB Seed Script
- Case Seed Script
- Privacy Page
- Terms Page
- Next.js Config
- Prisma CLI Dep
- QRCode Types Dep
- pytest Package Init
- PostCSS Config
- Tailwind Config
- F-03 Custom Fields (feature)
- F-04 Shared Steps (feature)
- F-05 Case History (feature)
- F-06 Test Plans (feature)
- F-09 Global Search (feature)
- F-10 Saved Views (feature)
- F-13 Parameters (feature)
- F-19 Environments (feature)
- F-21 Flaky Mute (feature)
- pytest-testforge (package)

## God Nodes (most connected - your core abstractions)
1. `logAudit()` - 175 edges
2. `requireSession()` - 163 edges
3. `guard()` - 69 edges
4. `notFoundError()` - 64 edges
5. `can()` - 61 edges
6. `caseDisplayId()` - 45 edges
7. `memberScope()` - 45 edges
8. `requirePerm()` - 40 edges
9. `validationError()` - 36 edges
10. `dispatchWebhook()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `OIDC single sign-on (TF_OIDC_ISSUER)` --semantically_similar_to--> `OAuth-only auth (Google + GitHub)`  [INFERRED] [semantically similar]
  README.md → APP-AUDIT.md
- `F-37 In-app user docs / help center` --references--> `TestForge Platform`  [INFERRED]
  docs/TODO-FEATURES.md → README.md
- `Framework-agnostic JUnit XML strategy` --rationale_for--> `Results API (POST /api/v1/results)`  [INFERRED]
  AUDIT-PRD.md → README.md
- `startTotpEnroll()` --references--> `qrcode`  [EXTRACTED]
  src/app/actions/two-factor.ts → package.json
- `FormInner()` --indirect_call--> `resetPassword()`  [INFERRED]
  src/components/ResetPasswordForm.tsx → src/app/actions/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **F-12 official reporters + CLI ecosystem** — packages_cli_testforge_cli, packages_playwright_reporter_testforge, packages_cypress_reporter_testforge, packages_pytest_testforge_plugin, readme_results_api [EXTRACTED 1.00]
- **CRON_SECRET-guarded scheduled endpoints** — github_workflows_purge, github_workflows_send_reports, github_workflows_sync_issues, github_workflows_purge_cron_secret [EXTRACTED 1.00]
- **Automation result ingest + TC matching flow** — readme_results_api, readme_junit_alias, readme_tc_annotation, readme_tc_id_scheme [EXTRACTED 1.00]

## Communities (120 total, 38 thin omitted)

### Community 0 - "API v1 REST Routes"
Cohesion: 0.09
Nodes (75): DELETE(), GET(), POST(), POST(), GET(), GET(), POST(), serializeGroup() (+67 more)

### Community 1 - "Comments & Attachments"
Cohesion: 0.08
Nodes (41): CommentInput, CommentResult, createComment(), deleteComment(), editComment(), listComments(), loadCommentViews(), notifyMentions() (+33 more)

### Community 2 - "Report Schedules & Pages"
Cohesion: 0.11
Nodes (33): createReportSchedule(), deleteReportSchedule(), requireScheduleAdmin(), ApiPage(), FRAMEWORKS, NewCasePage(), SharedStepsPage(), DashboardDetailPage() (+25 more)

### Community 3 - "Onboarding & Team Admin"
Cohesion: 0.08
Nodes (39): completeOnboarding(), ensureOrganization(), onboardingCreateProject(), onboardingIntegrations(), onboardingInvite(), TEMPLATE_SUITES, adminContext(), changeMemberRole() (+31 more)

### Community 4 - "Roles & Saved Views"
Cohesion: 0.08
Nodes (34): createSuite(), ActionResult, createRole(), deleteRole(), readPermissions(), requireOrgAdmin(), updateRole(), createSavedView() (+26 more)

### Community 5 - "Case/Plan/Dashboard Pages"
Cohesion: 0.11
Nodes (36): CaseDetailPage(), PlansPage(), dashboardReport(), loadLink(), metadata, runReport(), SharePage(), CoverageBarWidget() (+28 more)

### Community 6 - "Architecture Audit & Data Model"
Cohesion: 0.05
Nodes (44): API key stored as SHA-256 hash, Prisma data model (13 entities), First-user-becomes-admin bootstrap, OAuth-only auth (Google + GitHub), Soft delete (deletedAt filtering), TestForge Application Audit, Two-layer RBAC (global + ProjectMember), ERD gap fixes (milestones, api_keys, audit_logs) (+36 more)

### Community 7 - "Notifications & Delivery"
Cohesion: 0.08
Nodes (33): Delivery, TC, ActionResult, buildConfig(), createChannel(), deleteChannel(), readEvents(), requireChannelAdmin() (+25 more)

### Community 8 - "Dashboard & Run Pages"
Cohesion: 0.16
Nodes (26): muteCase(), GET(), DashboardPage(), PlanDetailPage(), ReportsPage(), RunsPage(), RunDetailPage(), MuteButton() (+18 more)

### Community 9 - "Bulk Case Operations"
Cohesion: 0.09
Nodes (28): bulkDeleteCases(), bulkUpdateCases(), reorderCases(), CsvRow, POST(), readCustomCells(), validateRow(), CaseForm() (+20 more)

### Community 10 - "Auth Pages (Login/Reset)"
Cohesion: 0.14
Nodes (18): metadata, SelfHostingPage(), ForgotPasswordPage(), LoginPage(), ResetPasswordPage(), VerifyEmailPage(), ForgotPasswordForm(), LanguageSwitcher() (+10 more)

### Community 11 - "Issue Tracker Integrations"
Cohesion: 0.11
Nodes (26): ActionResult, credentialsTouched(), deleteIntegration(), readAuth(), readBaseUrl(), requireIntegrationAdmin(), saveIntegration(), testIntegration() (+18 more)

### Community 12 - "Requirements & Traceability"
Cohesion: 0.16
Nodes (25): RFC-4180, createRequirement(), deleteRequirement(), importRequirementsCsv(), linkCaseToRequirement(), linkPaths(), parseCsv(), requireReqEditor() (+17 more)

### Community 13 - "Runs & Result Submission"
Cohesion: 0.17
Nodes (27): readCustomJson(), restoreRevision(), assertRunAccess(), completeRun(), rerunFailed(), submitResult(), DELETE(), findScopedCase() (+19 more)

### Community 14 - "Cypress Reporter Package"
Cohesion: 0.07
Nodes (29): cypress, optional, description, engines, node, exports, files, index.js (+21 more)

### Community 15 - "Two-Factor Auth (TOTP)"
Cohesion: 0.15
Nodes (23): RFC-4226, RFC-4648, verify2fa(), confirmTotpEnroll(), disableTotp(), NOTE: intentionally NO revalidatePath here. Revalidating would re-render the, regenerateRecoveryCodes(), startTotpEnroll() (+15 more)

### Community 16 - "Playwright Reporter Package"
Cohesion: 0.07
Nodes (29): description, engines, node, exports, files, @playwright/test, index.js, lib (+21 more)

### Community 17 - "Password Auth & Lockout"
Cohesion: 0.16
Nodes (26): BLACKLISTED_DOMAINS, failedAttempts, forgotPassword(), isLockedOut(), isWeakPassword(), login(), logout(), msgs() (+18 more)

### Community 18 - "Email Verify & CSV Import"
Cohesion: 0.10
Nodes (19): verifyEmailToken(), metadata, VerifyPage(), CsvImporter(), PreviewRow, Suite, DeleteCaseButton(), DeleteSuiteButton() (+11 more)

### Community 19 - "Case Actions (Clone/Move)"
Cohesion: 0.16
Nodes (22): caseWriteAccess(), cloneCase(), copyCasesToProject(), deleteCase(), moveCases(), readCaseFields(), readDatasetJson(), unmuteCase() (+14 more)

### Community 20 - "Issue Provider Clients (GitHub/GitLab)"
Cohesion: 0.15
Nodes (6): GitHubProvider, GitLabProvider, IssueProvider, JiraProvider, request(), trimBase()

### Community 21 - "Result Parsers (Mocha/NUnit)"
Cohesion: 0.13
Nodes (23): parseResults(), ResultFormat, MochaDoc, MochaErr, MochaTest, parseMocha(), collectCases(), NUnitDoc (+15 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, packages, **/*.ts (+18 more)

### Community 23 - "Help Center Content"
Cohesion: 0.17
Nodes (14): generateMetadata(), HelpTopicPage(), automation, gettingStarted, getHelpTopic(), HELP_TOPICS, integrations, notifications (+6 more)

### Community 24 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): bcryptjs, fast-xml-parser, jose, next, nodemailer, dependencies, bcryptjs, fast-xml-parser (+17 more)

### Community 25 - "Dev Dependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @playwright/test, postcss, tailwindcss (+17 more)

### Community 26 - "Projects & Milestones"
Cohesion: 0.15
Nodes (16): archiveProject(), createMilestone(), createProject(), deleteSuite(), slugify(), AppLayout(), ProjectsPage(), AuditLogPage() (+8 more)

### Community 27 - "Attachment Storage"
Cohesion: 0.16
Nodes (14): GET(), GET(), ATTACHMENT_ENTITY_TYPES, headerFilename(), INLINE_IMAGE_MIMES, removeAttachments(), sanitizeFilename(), saveAttachment() (+6 more)

### Community 28 - "CLI Package Manifest"
Cohesion: 0.08
Nodes (23): bin, testforge, description, engines, node, files, README.md, test-management (+15 more)

### Community 29 - "Shared Steps & Webhooks"
Cohesion: 0.16
Nodes (15): createCase(), createSharedGroup(), deleteSharedGroup(), readSteps(), updateSharedGroup(), createWebhook(), deleteWebhook(), DeleteButton() (+7 more)

### Community 30 - "Case Review Workflow"
Cohesion: 0.20
Nodes (17): ActionResult, approveCase(), caseUrl(), loadScopedCase(), requestChanges(), requestReview(), Member, ReviewPanel() (+9 more)

### Community 31 - "pytest Plugin Client"
Cohesion: 0.15
Nodes (6): Minimal TestForge REST client for the pytest plugin.  Uses only the standard lib, TestForgeClient, pytest_configure(), pytest plugin that streams results to TestForge.  Creates a run at session start, _TestForgePlugin, TestForgeClient

### Community 32 - "Test Plans & Runs"
Cohesion: 0.16
Nodes (12): completePlan(), createPlan(), createRun(), CaseSelector(), SelectableCase, CompletePlanButton(), ConfigGroupInput, NewPlanForm() (+4 more)

### Community 33 - "TestLink Importer"
Cohesion: 0.18
Nodes (15): PARSERS, POST(), commitImport(), IMPORTANCE_MAP, mapImportance(), parseTestLinkXml(), TLCase, TLDoc (+7 more)

### Community 34 - "Playwright Reporter Impl"
Cohesion: 0.15
Nodes (3): mapStatus(), TestForgeReporter, TestForgeClient

### Community 35 - "Project Members RBAC"
Cohesion: 0.25
Nodes (13): addProjectMember(), changeProjectMemberRole(), isValidRole(), manageContext(), ownerCount(), ProjectMemberResult, removeProjectMember(), VALID_ROLES (+5 more)

### Community 36 - "OIDC SSO Providers"
Cohesion: 0.24
Nodes (11): GET(), PROVIDERS, GET(), loginError(), base64url(), GET(), createSession(), Discovery (+3 more)

### Community 37 - "Team Invitations"
Cohesion: 0.22
Nodes (8): acceptInvite(), GET(), GET(), EMPTY, GET(), InvitePage(), AcceptInvite(), getSession()

### Community 38 - "Issue Creation from Results"
Cohesion: 0.25
Nodes (13): ActionResult, createIssueFromResult(), linkIssue(), previewIssueFromResult(), resolveIntegration(), unlinkIssue(), CreateIssueModal(), displayIssueKey() (+5 more)

### Community 39 - "Custom Result Statuses"
Cohesion: 0.32
Nodes (11): ActionResult, createResultStatus(), ensureSeeded(), moveResultStatus(), requireStatusAdmin(), toggleResultStatus(), updateResultStatus(), KINDS (+3 more)

### Community 40 - "Reporters & Results API (F-11/F-12)"
Cohesion: 0.28
Nodes (13): Framework-agnostic JUnit XML strategy, F-11 Additional automation result formats, F-12 Official reporters + CLI, E2E Playwright suite (dogfooding), E2E Playwright workflow, testforge-cli uploader, testforge-cypress-reporter, testforge-playwright-reporter (+5 more)

### Community 41 - "E2E History/Flaky Specs"
Cohesion: 0.15
Nodes (5): TC, E2E, TC, TC, TC

### Community 42 - "Cypress Reporter Impl"
Cohesion: 0.23
Nodes (3): mapState(), registerTestForge(), TestForgeClient

### Community 43 - "Custom Fields"
Cohesion: 0.32
Nodes (10): assertFieldAdmin(), createFieldDef(), moveFieldDef(), parseOptionsInput(), toggleFieldActive(), updateFieldDef(), CustomFieldsManager(), EditRowForm() (+2 more)

### Community 44 - "TestRail Importer"
Cohesion: 0.22
Nodes (12): mapPriority(), mapType(), parseTestRailXml(), PRIORITY_BY_ID, PRIORITY_BY_NAME, TRCase, TRDoc, TRSection (+4 more)

### Community 45 - "Dashboard/Params E2E Specs"
Cohesion: 0.17
Nodes (4): TC, db, TC, TC

### Community 46 - "Configurations Admin"
Cohesion: 0.29
Nodes (8): ActionResult, addConfigOption(), createConfigGroup(), deleteConfigGroup(), deleteConfigOption(), requireConfigAdmin(), ConfigGroupView, ConfigurationsManager()

### Community 47 - "Dashboards Builder"
Cohesion: 0.36
Nodes (9): addWidget(), createDashboard(), deleteDashboard(), NUDGES, nudgeWidget(), removeWidget(), requireDashboardEditor(), WIDGET_TYPES (+1 more)

### Community 48 - "Qase Importer"
Cohesion: 0.21
Nodes (11): buildSuitePath(), mapPriority(), mapType(), parseQaseJson(), PRIORITY_MAP, QaseCase, QaseDoc, QaseStep (+3 more)

### Community 49 - "Integrations E2E & Crypto"
Cohesion: 0.24
Nodes (7): MockState, startMockGitHub(), TC, appSecret(), encrypt(), key(), isIssueClosed()

### Community 50 - "Account & Password Change"
Cohesion: 0.33
Nodes (7): changePassword(), isWeakPassword(), AccountPage(), ChangePasswordForm(), TwoFactorSettings(), hasUsablePassword(), verifyPassword()

### Community 51 - "API Keys"
Cohesion: 0.29
Nodes (5): createApiKey(), deleteApiKey(), ApiKeysPage(), ApiKeyCreator(), DeleteApiKeyButton()

### Community 52 - "Environments Admin"
Cohesion: 0.35
Nodes (8): ActionResult, createEnvironment(), deleteEnvironment(), requireEnvAdmin(), setAutoCreateEnvs(), toggleEnvironmentActive(), EnvironmentsManager(), EnvironmentView

### Community 53 - "NPM Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:push, dev, e2e, e2e:upload, lint, prebuild (+2 more)

### Community 54 - "Run Comparison"
Cohesion: 0.31
Nodes (8): EditCasePage(), Delta, DELTA_META, DELTA_ORDER, deltaOf(), RunComparePage(), caseDisplayId(), parseDatasets()

### Community 55 - "Signup Form"
Cohesion: 0.27
Nodes (5): metadata, SignupPage(), passwordStrength(), SignupForm(), slugify()

### Community 56 - "TOTP Self-Test Script"
Cohesion: 0.28
Nodes (7): base32Decode(), hotp(), RFC-6238, secret, seed, totpAt(), vectors8

### Community 57 - "Case History UI"
Cohesion: 0.25
Nodes (6): CaseHistory(), FIELDS, RevisionView, scalarText(), Snapshot, SnapshotStep

### Community 58 - "Monorepo Workspaces"
Cohesion: 0.25
Nodes (7): name, private, version, workspaces, packages/cli, packages/cypress-reporter, packages/playwright-reporter

### Community 59 - "JUnit Ingest & API-Key Auth"
Cohesion: 0.36
Nodes (6): POST(), authenticateApiKey(), JUnitCase, JUnitDoc, JUnitSuite, parseJUnit()

### Community 60 - "Landing / Home Page"
Cohesion: 0.29
Nodes (5): getGitHubStars(), HomePage(), integrationNames, metadata, BrandIcon()

### Community 61 - "Cucumber Parser"
Cohesion: 0.29
Nodes (7): CucumberElement, CucumberFeature, CucumberStep, CucumberStepResult, parseCucumber(), SEVERITY, statusForSteps()

### Community 63 - "TOTP Lib & 2FA E2E"
Cohesion: 0.38
Nodes (4): base32Decode(), totp(), RFC-6238, TC

### Community 65 - "JUnit Upload Script"
Cohesion: 0.33
Nodes (3): ORIGIN, slug, xml

### Community 66 - "Issue Status Sync"
Cohesion: 0.53
Nodes (4): GET(), sleep(), syncIssueStatuses(), SyncReport

### Community 67 - "Root Layout & Fonts"
Cohesion: 0.33
Nodes (4): display, metadata, mono, sans

### Community 68 - "2FA Login Flow"
Cohesion: 0.47
Nodes (3): TwoFactorLoginPage(), TwoFactorLoginForm(), readPending2fa()

### Community 69 - "TRX Parser"
Cohesion: 0.40
Nodes (5): parseTrx(), parseTrxDuration(), TrxDoc, TrxUnitTest, TrxUnitTestResult

### Community 71 - "Mock OIDC E2E"
Cohesion: 0.60
Nodes (3): MockOidcControls, startMockOidc(), TC

### Community 72 - "Importers E2E"
Cohesion: 0.50
Nodes (3): fixture(), TC, uploadFixture()

### Community 73 - "Reporters/CLI E2E"
Cohesion: 0.50
Nodes (4): apiKey(), ROOT, runNode(), TC

### Community 76 - "CLI Uploader"
Cohesion: 0.80
Nodes (4): cmdUpload(), fail(), main(), parseArgs()

### Community 78 - "Command Palette"
Cohesion: 0.50
Nodes (4): CommandPalette(), groupItems(), Item, Recent

### Community 84 - "ESLint Config"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 85 - "App Icon / Brand Mark"
Cohesion: 0.67
Nodes (4): Anvil and Hammer Motif, TestForge App Icon / Brand Mark, Forge Spark Accents, Indigo Rounded-Square Favicon

### Community 88 - "Prisma Global Setup"
Cohesion: 0.67
Nodes (3): globalSetup(), @prisma/client, @prisma/client

## Knowledge Gaps
- **381 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `TC`, `PNG_1PX`, `TC` (+376 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireSession()` connect `Projects & Milestones` to `Comments & Attachments`, `Report Schedules & Pages`, `Onboarding & Team Admin`, `Roles & Saved Views`, `Case/Plan/Dashboard Pages`, `Notifications & Delivery`, `Dashboard & Run Pages`, `Bulk Case Operations`, `Issue Tracker Integrations`, `Requirements & Traceability`, `Runs & Result Submission`, `Two-Factor Auth (TOTP)`, `Case Actions (Clone/Move)`, `Shared Steps & Webhooks`, `Case Review Workflow`, `Test Plans & Runs`, `Project Members RBAC`, `Team Invitations`, `Issue Creation from Results`, `Custom Result Statuses`, `Custom Fields`, `Configurations Admin`, `Dashboards Builder`, `Account & Password Change`, `API Keys`, `Environments Admin`, `Run Comparison`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Prisma Global Setup`, `Monorepo Workspaces`, `Prisma CLI Dep`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `startTotpEnroll()` connect `Two-Factor Auth (TOTP)` to `Runtime Dependencies`, `Integrations E2E & Crypto`, `Projects & Milestones`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `TC` to the rest of the system?**
  _381 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API v1 REST Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08731327582579423 - nodes in this community are weakly interconnected._
- **Should `Comments & Attachments` be split into smaller, more focused modules?**
  _Cohesion score 0.07617051013277429 - nodes in this community are weakly interconnected._
- **Should `Report Schedules & Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.11103047895500726 - nodes in this community are weakly interconnected._