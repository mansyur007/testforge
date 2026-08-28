# Graph Report - testforge  (2026-08-28)

## Corpus Check
- 567 files · ~694,306 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3803 nodes · 10065 edges · 220 communities (174 shown, 46 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 163 edges (avg confidence: 0.84)
- Token cost: 506,312 input · 0 output

## Community Hubs (Navigation)
- API v2 Routes
- API v1 Routes
- Baselines and Public Share Actions
- Quality Gate and Dashboard
- Academy Certificates and Exams
- Academy Lesson Pages
- Project Tabs and Settings Pages
- Plans and Runs Actions
- Test Case Model
- Auth Pages (Login, 2FA)
- Settings Layout and Certificate Cards
- Academy Self-Check Scripts
- Certificate OG Images and SEO
- Generated API Client Methods
- Test Cases UI Screenshot
- Theme and Root Layout
- Dashboards and Widgets
- Academy Progress and Coach
- Superadmin Console
- Academy Sandbox
- Requirements and CSV Import
- E2E Dogfooding Pipeline
- Run Detail and Print Views
- Notification Channels
- Exam Attempt Pages
- Public Project Overview
- AI Assist Actions
- Exploratory Sessions
- Academy E2E Spec
- Dev Dependencies
- Case Dependencies and Mutations
- Integrations Manager
- CLI Cases Command
- Manual Pro Track Content
- Indonesian Track Translations
- Assorted E2E Specs
- Auth Actions and LDAP Login
- Exam Bank Check Script
- Custom Result Statuses
- JUnit Result Parsing
- Fundamentals Track Content
- Indonesian Fundamentals Translations
- Issue Provider Clients
- Print and Badge E2E Specs
- TypeScript Config
- Comments Actions
- Automation Track Content
- Two-Factor TOTP
- Public Case and Report Pages
- Indonesian Automation Translations
- Case Review Workflow
- API Client Errors and Index
- Generated API Types
- Defects Actions
- Backup and Restore Routes
- Onboarding Wizard
- Run Realtime Events (SSE)
- Indonesian Glossary Check
- Playwright Reporter Package
- Icon and Bundle Check Scripts
- Backup Core Self-Check
- Importers (Gherkin, TestLink)
- Help Center Content
- Cypress Reporter Manifest
- Pytest Plugin Client
- Roles and Permissions
- OpenAPI v2 Spec
- Attachment Uploader and Executor
- Team Management Actions
- Run Execution UI Screenshot
- Mock LDAP Fixture
- Package Keywords
- Playwright Reporter Implementation
- Academy Me and Sitemap
- Cases Table Bulk Edit
- Issues Actions and Routes
- Project Members
- Saved Views and Export Menu
- Offline Queue
- Academy Redesign Directions
- API Client Manifest
- CLI Package Manifest
- Beyond Track Content
- API Client Codegen
- Badge and Webhooks
- Suite Tree Operations
- Case Form Components
- ISTQB Track Content
- Indonesian Beyond Translations
- Indonesian ISTQB Translations
- Runtime Dependencies
- Cases-as-Code Rationale
- TOTP Fixtures and Self-Test
- Attachment Storage Routes
- Baseline Comparison
- Docs Feature Catalog
- Integrations E2E and Crypto
- Account Password Change
- CLI Sync Gaps and Fixes
- NPM Scripts
- Cypress Reporter Implementation
- API Keys Management
- Custom Field Definitions
- Issue Panel UI
- OIDC Login
- Shared Steps API
- Exam Engine
- TestRail Importer
- Docker Estate Rules
- Indonesian Glossary Rules
- Indonesian Academy Decisions
- Backup Restore E2E
- Exam Core Self-Test
- Configurations Manager
- Shared Steps Manager
- ISTQB Syllabus Objectives
- Qase Importer
- Academy Audit Method
- Cases-as-Code E2E
- Package Files Lists
- Projects and Suites Actions
- CSV Case Import
- My Work Page
- Case Dependencies API
- Quality Badge SVG
- Monorepo Workspaces
- Certificate Serial Self-Test
- Palette Token Check
- Share Links
- Public Cases Browser
- Case History and Revisions
- LDAP Client
- Storage Driver
- Caddy Front Door Ops
- Build-Time Env Baking
- Superadmin and Sandbox Gaps
- Quality Gate E2E
- Realtime Run E2E
- Restore Script
- Cucumber Result Parser
- CI Build Gates
- Audit Assurance Rules
- API v2 E2E
- Bulk Copy and Reorder E2E
- Defect Panel UI
- API Docs Page
- Site OG Image
- NUnit Result Parser
- Deploy Pipeline Shape
- Shared Docker Network
- Comments E2E
- Public Share E2E
- Suite Tree E2E
- JUnit Upload Script
- Issue Status Sync
- OpenAPI v1 Spec
- TRX Result Parser
- Superadmin Env Contract
- Competitor Comparison
- Custom Statuses E2E
- Mock OIDC Fixture
- Importers E2E
- Responsive E2E
- Result Formats E2E
- Review E2E
- Saved Views E2E
- App Icon 192px
- App Icon 512px
- Maskable App Icon
- Onboarding Page
- Attachments E2E
- Case Dependencies E2E
- Estimates Forecast E2E
- PWA Mobile E2E
- Reporters CLI E2E
- Scheduled Reports E2E
- Search Palette E2E
- Session Integrity E2E
- ESLint Config
- Prisma Seed
- Logout Action
- Favicon Brand Mark
- Custom Fields E2E
- Defects E2E
- Gherkin E2E
- My Work E2E
- Run Comparison E2E
- Shared Steps E2E
- Smoke E2E
- XLSX and JSON Export E2E
- README Feature Highlights
- Case Seeding Script
- Tailwind Config
- ExcelJS Dependency
- ldapts Dependency
- Next Config
- Nodemailer Dependency
- jose Dependency
- Prisma Client Dependency
- qrcode Dependency
- React Dependency
- React DOM Dependency
- rehype-sanitize Dependency
- remark-gfm Dependency
- server-only Dependency
- Pytest Plugin Package
- PostCSS Config
- Glossary Code Sample Rule
- Docs Part I App Audit
- Docs Part II PRD Audit
- Docs Part III Comparison
- E2E Workflow
- pytest-testforge Project

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 232 edges
2. `logAudit()` - 185 edges
3. `guard()` - 113 edges
4. `notFoundError()` - 107 edges
5. `getSession` - 76 edges
6. `caseDisplayId()` - 74 edges
7. `requirePerm()` - 63 edges
8. `can()` - 55 edges
9. `Lesson` - 55 edges
10. `guardV2()` - 55 edges

## Surprising Connections (you probably didn't know these)
- `testforge-data named volume (dev)` --semantically_similar_to--> `testforge_data named volume (prod)`  [INFERRED] [semantically similar]
  docker-compose.yml → docker-compose.prod.yml
- `testforge development compose service` --semantically_similar_to--> `testforge production compose service`  [INFERRED] [semantically similar]
  docker-compose.yml → docker-compose.prod.yml
- `Nightly-schedule deploy policy (02:00 WIB, skip if no new commits)` --references--> `emha_shared external docker network`  [AMBIGUOUS]
  .github/workflows/deploy.yml → .claude/skills/emha-deploy/SKILL.md
- `emha_shared external network declaration (prod)` --references--> `emha_shared external docker network`  [AMBIGUOUS]
  docker-compose.prod.yml → .claude/skills/emha-deploy/SKILL.md
- `testforge production compose service` --implements--> `Join emha_shared as external, publish no host ports`  [INFERRED]
  docker-compose.prod.yml → .claude/skills/emha-docker/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **TestForge deploy pipeline (CI gate → staleness check → rsync → compose up → smoke test)** — _github_workflows_ci_build, _github_workflows_deploy_check, _github_workflows_deploy_rsync_sync, _github_workflows_deploy_build_and_up, _github_workflows_deploy_smoke_test, docker_compose_prod_testforge, readme_git_deploy_workflow [EXTRACTED 1.00]
- **Shared-Caddy fronting convention (external network, no host ports, fixed internal port)** — _claude_skills_emha_deploy_skill_emha_caddy, _claude_skills_emha_deploy_skill_emha_shared_network, _claude_skills_emha_docker_skill_shared_network_no_host_ports, _claude_skills_emha_docker_skill_fixed_internal_ports, docker_compose_prod_testforge, docker_compose_prod_emha_shared [INFERRED 0.95]
- **NEXT_PUBLIC_* build-time baking chain (skill rule, CI build env, prod build args, agent instructions)** — _claude_skills_emha_deploy_skill_next_public_build_time_bake, _github_workflows_ci_next_build, docker_compose_prod_build_args, readme_ai_agent_instructions [INFERRED 0.95]
- **Academy prebuild assertion suite** — scripts_academy_i18n_check, scripts_academy_bank_check, scripts_academy_trademark_check, scripts_academy_exam_selftest, scripts_academy_certificate_selftest, docs_audit_academy_build_assured [EXTRACTED 1.00]
- **Audit remediation work packages WP-1…WP-4** — docs_audit_academy_wp_1, docs_audit_academy_wp_2, docs_audit_academy_wp_3, docs_audit_academy_wp_4, docs_audit_academy [EXTRACTED 1.00]
- **Anonymous-to-account Academy funnel** — docs_qa_academy_hybrid_placement, docs_qa_academy_anonymous_progress, docs_qa_academy_claim_at_signup, docs_qa_academy_sandbox, docs_qa_academy_certificate_model [INFERRED 0.85]
- **Framework integrations that stream results into TestForge runs** — packages_cypress_reporter_readme_registertestforge, packages_playwright_reporter_readme_reporter, packages_pytest_testforge_readme_plugin, packages_cli_readme_upload_command [INFERRED 0.85]
- **TC-<SLUG>-<n> case-matching contract shared across all reporters** — packages_cli_readme_tc_slug_annotation, e2e_readme_tc_e2e_annotation, packages_cypress_reporter_readme_status_mapping, packages_playwright_reporter_readme_status_mapping, packages_pytest_testforge_readme_node_id_matching [INFERRED 0.85]
- **API key scoping, tenant isolation and rate budgeting** — packages_api_client_readme_project_scoped_keys, packages_api_client_readme_rate_limit_retry, e2e_readme_tenant_isolation, e2e_readme_api_key_settling, packages_cli_readme_testforge_env_config [INFERRED 0.75]
- **Test Case Metadata Model (id, priority, type, automation, tags)** — docs_images_cases_human_readable_case_id, docs_images_cases_case_priority_field, docs_images_cases_case_type_field, docs_images_cases_automation_status_field, docs_images_cases_case_tags_field [EXTRACTED 1.00]
- **Suite Hierarchy Navigation Flow** — docs_images_cases_test_suites_tree_panel, docs_images_cases_folders_breadcrumb_cards, docs_images_cases_authentication_suite, docs_images_cases_login_subsuite, docs_images_cases_add_suite_form [INFERRED 0.85]
- **Case List Filtering and Bulk Action Surface** — docs_images_cases_filter_toolbar, docs_images_cases_needs_my_review_filter, docs_images_cases_import_export_actions, docs_images_cases_bulk_selection_checkboxes, docs_images_cases_test_case_table [INFERRED 0.85]
- **Test-health signal panels on the Reports page (flakiness, bug correlation, muting)** — docs_images_reports_flaky_tests_panel, docs_images_reports_bug_correlation_panel, docs_images_reports_muted_tests_panel, docs_images_reports_tc_web_003 [INFERRED 0.85]
- **Inputs that determine reported pass-rate math** — docs_images_reports_overall_pass_rate, docs_images_reports_total_executions, docs_images_reports_failed_count, docs_images_reports_mute_quarantine_semantics, docs_images_reports_environment_filter [INFERRED 0.85]
- **Manual run execution and result capture flow** — docs_images_run_case_result_list, docs_images_run_case_execution_detail_panel, docs_images_run_evidence_dropzone, docs_images_run_defects_section, docs_images_run_run_progress_summary [INFERRED 0.85]
- **Run close-out action set in the page header** — docs_images_run_export_and_print_view, docs_images_run_rerun_failed_action, docs_images_run_mark_complete_action, docs_images_run_smoke_test_sprint_1 [EXTRACTED 1.00]
- **Signals that keep run results honest over time** — docs_images_run_revision_pinning, docs_images_run_muted_case_status, docs_images_run_criticality_badge, docs_images_run_run_progress_summary [INFERRED 0.75]
- **TestForge Icon Visual Identity System** — public_icons_icon_192_app_icon, public_icons_icon_192_anvil_pen_mark, public_icons_icon_192_indigo_rounded_tile, public_icons_icon_192_flat_monochrome_glyph_style [INFERRED 0.85]
- **TestForge Maskable Icon Design System** — public_icons_icon_512_maskable, public_icons_icon_512_maskable_anvil_mark, public_icons_icon_512_maskable_safe_zone, public_icons_icon_512_maskable_indigo_palette [INFERRED 0.85]
- **TestForge Icon Visual Identity System** — public_icons_icon_512_app_icon, public_icons_icon_512_anvil_pencil_mark, public_icons_icon_512_spark_accents, public_icons_icon_512_indigo_brand_surface [INFERRED 0.85]
- **CRON_SECRET-guarded scheduled endpoints** — github_workflows_purge, github_workflows_send_reports, github_workflows_sync_issues, github_workflows_purge_cron_secret [EXTRACTED 1.00]

## Communities (220 total, 46 thin omitted)

### Community 0 - "API v2 Routes"
Cohesion: 0.11
Nodes (80): DELETE(), GET(), load(), GET(), POST(), DELETE(), GET(), load() (+72 more)

### Community 1 - "API v1 Routes"
Cohesion: 0.09
Nodes (67): GET(), DELETE(), DELETE(), GET(), POST(), DELETE(), GET(), POST() (+59 more)

### Community 2 - "Baselines and Public Share Actions"
Cohesion: 0.06
Nodes (59): createBaselineAction(), deleteBaseline(), authorize(), disablePublicShare(), enablePublicShare(), revalidateShare(), updatePublicShare(), createReportSchedule() (+51 more)

### Community 3 - "Quality Gate and Dashboard"
Cohesion: 0.06
Nodes (58): saveGatePolicy(), GET(), GET(), DashboardPage(), dynamic, dynamic, PlansPage(), dynamic (+50 more)

### Community 4 - "Academy Certificates and Exams"
Cohesion: 0.05
Nodes (63): clientKey(), ExamAttemptSummary, examClientKey(), getExamAttempt(), gradeSelfCheck(), renameCertificateHolderAction(), setCertificateVisibilityAction(), startExamAction() (+55 more)

### Community 5 - "Academy Lesson Pages"
Cohesion: 0.08
Nodes (51): PracticeExamPage(), dynamic, generateMetadata(), dynamic, generateMetadata(), dynamic, generateMetadata(), dynamic (+43 more)

### Community 6 - "Project Tabs and Settings Pages"
Cohesion: 0.05
Nodes (52): ApiPage(), dynamic, BaselinesPage(), dynamic, DefectsPage(), dynamic, dynamic, FieldsPage() (+44 more)

### Community 7 - "Plans and Runs Actions"
Cohesion: 0.07
Nodes (49): completePlan(), createPlan(), assertRunAccess(), completeRun(), createRun(), rerunFailed(), GET(), PROVIDERS (+41 more)

### Community 8 - "Test Case Model"
Cohesion: 0.08
Nodes (52): copyCasesToProject(), createCase(), readCaseFields(), readCustomJson(), readDatasetJson(), restoreRevision(), GET(), GET() (+44 more)

### Community 9 - "Auth Pages (Login, 2FA)"
Cohesion: 0.06
Nodes (40): dynamic, ForgotPasswordPage(), metadata, dynamic, metadata, dynamic, LoginPage(), metadata (+32 more)

### Community 10 - "Settings Layout and Certificate Cards"
Cohesion: 0.05
Nodes (36): metadata, CertificateCard(), CertificateDisclaimer(), formatCertificateDate(), copy, randomTail(), SampleCertificate(), openDialog() (+28 more)

### Community 11 - "Academy Self-Check Scripts"
Cohesion: 0.06
Nodes (50): bvaMissing99, checkedSlugs(), KNOWN_SELF_ASSESSED, selfAssessed, shippingRules(), tcase(), unchecked, caseCheckers (+42 more)

### Community 12 - "Certificate OG Images and SEO"
Cohesion: 0.07
Nodes (38): alt, contentType, Image(), runtime, size, CertificatePage(), dynamic, generateMetadata() (+30 more)

### Community 13 - "Generated API Client Methods"
Cohesion: 0.05
Nodes (11): ApiMethods, RequestOptions, ActionResult, createEnvironment(), deleteEnvironment(), requireEnvAdmin(), setAutoCreateEnvs(), toggleEnvironmentActive() (+3 more)

### Community 14 - "Test Cases UI Screenshot"
Cohesion: 0.06
Nodes (48): Add Suite Form (name + parent select), AI Assist Nav Item, API Keys Nav Item, Authentication Suite, Automation Status Field (Automated/In progress/Not automated), Bulk Selection Checkboxes, Case Priority Field (Critical/High/Medium), Case Tags Field (+40 more)

### Community 15 - "Theme and Root Layout"
Cohesion: 0.08
Nodes (37): metadata, display, metadata, mono, sans, viewport, PaletteSwitcher(), swatchFor() (+29 more)

### Community 16 - "Dashboards and Widgets"
Cohesion: 0.09
Nodes (32): addWidget(), createDashboard(), deleteDashboard(), NUDGES, nudgeWidget(), removeWidget(), requireDashboardEditor(), DashboardDetailPage() (+24 more)

### Community 17 - "Academy Progress and Coach"
Cohesion: 0.11
Nodes (37): claimAcademyProgress(), getMyLessonProgress(), markLessonDoneAction(), markLessonNotDoneAction(), verifyTask(), LessonRail(), RailLesson, IndexLesson (+29 more)

### Community 18 - "Superadmin Console"
Cohesion: 0.09
Nodes (34): clientIp(), failed, lockedOut(), recordFailure(), superadminLogin(), superadminLogout(), dynamic, GET() (+26 more)

### Community 19 - "Academy Sandbox"
Cohesion: 0.08
Nodes (32): AcademySandboxPage(), dynamic, metadata, openSandbox(), openSandboxTask(), resetSandboxAction(), AppLayout(), metadata (+24 more)

### Community 20 - "Requirements and CSV Import"
Cohesion: 0.11
Nodes (30): RFC-4180, createRequirement(), deleteRequirement(), importRequirementsCsv(), linkCaseToRequirement(), linkPaths(), parseCsv(), requireReqEditor() (+22 more)

### Community 21 - "E2E Dogfooding Pipeline"
Cohesion: 0.08
Nodes (37): Fixed E2E API key upserted by hash, E2E Playwright suite (dogfooding TestForge), Env-driven upload target (TF_API_URL / TF_PROJECT / TF_API_KEY), globalSetup fixture seeding, /api/v1/junit ingestion endpoint, Token-free deterministic E2E (no model in the loop), scripts/seed-cases.mjs (prod case bootstrap), TC-E2E-<n> test-name annotation (+29 more)

### Community 22 - "Run Detail and Print Views"
Cohesion: 0.10
Nodes (27): dynamic, RunDetailPage(), CaseSection(), dynamic, formatBytes(), PrintCasesPage(), dynamic, KEY_ICONS (+19 more)

### Community 23 - "Notification Channels"
Cohesion: 0.10
Nodes (24): Delivery, TC, ActionResult, buildConfig(), createChannel(), deleteChannel(), readEvents(), requireChannelAdmin() (+16 more)

### Community 24 - "Exam Attempt Pages"
Cohesion: 0.10
Nodes (22): ExamAttemptPage(), ChapterQuizPage(), dynamic, findQuiz(), generateMetadata(), dynamic, metadata, acceptInvite() (+14 more)

### Community 25 - "Public Project Overview"
Cohesion: 0.11
Nodes (29): DATE_FORMAT, loadStats(), PublicOverviewPage(), revalidate, ACTIVITY_LEVELS, ActivityPanel(), AUTOMATION_FILL, AutomationPanel() (+21 more)

### Community 26 - "AI Assist Actions"
Cohesion: 0.14
Nodes (26): generateCasesPreview(), insertDraftCases(), projectWriteOrThrow(), requireOrgAdmin(), saveAiSettings(), suggestStepsForCase(), testAiConnection(), ProjectPage() (+18 more)

### Community 27 - "Exploratory Sessions"
Cohesion: 0.11
Nodes (24): ActionResult, addNote(), convertNoteToCase(), convertNoteToIssue(), endSession(), ownedActiveSession(), GET(), POST() (+16 more)

### Community 28 - "Academy E2E Spec"
Cohesion: 0.11
Nodes (14): ANSWER_KEY, answerAllQuestions(), answerCurrentQuestion(), db, TC, CH1_FUNDAMENTALS, CH2_SDLC, CH3_STATIC_TESTING (+6 more)

### Community 29 - "Dev Dependencies"
Cohesion: 0.06
Nodes (31): eslint, eslint-config-next, ldapjs, devDependencies, eslint, eslint-config-next, ldapjs, postcss (+23 more)

### Community 30 - "Case Dependencies and Mutations"
Cohesion: 0.11
Nodes (24): ActionResult, addDependency(), removeDependency(), caseWriteAccess(), cloneCase(), deleteCase(), muteCase(), unmuteCase() (+16 more)

### Community 31 - "Integrations Manager"
Cohesion: 0.10
Nodes (23): ActionResult, credentialsTouched(), deleteIntegration(), readAuth(), readBaseUrl(), requireIntegrationAdmin(), saveIntegration(), testIntegration() (+15 more)

### Community 32 - "CLI Cases Command"
Cohesion: 0.17
Nodes (28): allIds(), api(), classify(), cmdCases(), config(), diffFields(), emitCase(), fail() (+20 more)

### Community 33 - "Manual Pro Track Content"
Cohesion: 0.12
Nodes (16): accessibilityBasics, apiTesting, crossBrowserMobile, exploratoryTesting, httpAndDevtools, manualPro, metricsThatMeanSomething, nonFunctionalBasics (+8 more)

### Community 34 - "Indonesian Track Translations"
Cohesion: 0.10
Nodes (16): automationId, ID_TRACK_TRANSLATIONS, accessibilityBasicsId, apiTestingId, crossBrowserMobileId, exploratoryTestingId, httpAndDevtoolsId, manualProId (+8 more)

### Community 35 - "Assorted E2E Specs"
Cohesion: 0.07
Nodes (9): TC, TC, TC, TC, TC, db, TC, TC (+1 more)

### Community 36 - "Auth Actions and LDAP Login"
Cohesion: 0.14
Nodes (24): BLACKLISTED_DOMAINS, failedAttempts, forgotPassword(), isLockedOut(), isWeakPassword(), LdapLoginOutcome, login(), loginViaLdap() (+16 more)

### Community 37 - "Exam Bank Check Script"
Cohesion: 0.07
Nodes (24): §7.2 Every exam answer key re-derived (254/255 correct), ch1-q11 — the one wrong answer key (test analysis vs test design), authored, authoredSplit, byId, depthCounts, drawInput, ids (+16 more)

### Community 38 - "Custom Result Statuses"
Cohesion: 0.13
Nodes (21): ActionResult, createResultStatus(), ensureSeeded(), moveResultStatus(), requireStatusAdmin(), toggleResultStatus(), updateResultStatus(), submitResult() (+13 more)

### Community 39 - "JUnit Result Parsing"
Cohesion: 0.14
Nodes (22): POST(), parseResults(), ResultFormat, JUnitCase, JUnitDoc, JUnitSuite, parseJUnit(), MochaDoc (+14 more)

### Community 40 - "Fundamentals Track Content"
Cohesion: 0.11
Nodes (14): boundaryValueAnalysis, bugReports, decisionTables, defectLifecycle, equivalencePartitioning, fundamentals, sdlcAndStlc, sevenPrinciples (+6 more)

### Community 41 - "Indonesian Fundamentals Translations"
Cohesion: 0.11
Nodes (14): boundaryValueAnalysisId, bugReportsId, decisionTablesId, defectLifecycleId, equivalencePartitioningId, fundamentalsId, sdlcAndStlcId, sevenPrinciplesId (+6 more)

### Community 42 - "Issue Provider Clients"
Cohesion: 0.15
Nodes (6): GitHubProvider, GitLabProvider, IssueProvider, JiraProvider, request(), trimBase()

### Community 43 - "Print and Badge E2E Specs"
Cohesion: 0.07
Nodes (9): TC, TC, E2E, TC, TC, TC, TC, TC (+1 more)

### Community 44 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, packages, **/*.ts (+18 more)

### Community 45 - "Comments Actions"
Cohesion: 0.17
Nodes (22): CommentInput, CommentResult, createComment(), deleteComment(), editComment(), listComments(), loadCommentViews(), notifyMentions() (+14 more)

### Community 46 - "Automation Track Content"
Cohesion: 0.14
Nodes (14): apiAutomation, assertionsAndWaiting, ciGithubActions, firstPlaywrightTest, flakyTests, frameworkDesign, automation, junitToTestforge (+6 more)

### Community 47 - "Two-Factor TOTP"
Cohesion: 0.15
Nodes (17): RFC-4226, RFC-4648, confirmTotpEnroll(), disableTotp(), NOTE: intentionally NO revalidatePath here. Revalidating would re-render the, regenerateRecoveryCodes(), startTotpEnroll(), base32Decode() (+9 more)

### Community 48 - "Public Case and Report Pages"
Cohesion: 0.18
Nodes (22): generateMetadata(), loadCase(), PublicCaseDetailPage(), revalidate, generateMetadata(), PublicLayout(), generateMetadata(), generateMetadata() (+14 more)

### Community 49 - "Indonesian Automation Translations"
Cohesion: 0.15
Nodes (13): apiAutomationId, assertionsAndWaitingId, ciGithubActionsId, firstPlaywrightTestId, flakyTestsId, frameworkDesignId, junitToTestforgeId, locatorsId (+5 more)

### Community 50 - "Case Review Workflow"
Cohesion: 0.15
Nodes (19): ActionResult, approveCase(), caseUrl(), loadScopedCase(), requestChanges(), requestReview(), GET(), dynamic (+11 more)

### Community 51 - "API Client Errors and Index"
Cohesion: 0.09
Nodes (10): buildMethods(), FieldErrorDetail, RateLimitState, TestForgeApiError, TestForgeClient, TestForgeClientBase, TestForgeClientOptions, readRateLimit() (+2 more)

### Community 52 - "Generated API Types"
Cohesion: 0.08
Nodes (23): ApiError, Attachment, Environment, EnvironmentInput, EnvironmentUpdate, Field, FieldInput, FieldUpdate (+15 more)

### Community 53 - "Defects Actions"
Cohesion: 0.19
Nodes (19): changeDefectStatus(), createDefect(), deleteDefect(), readDefectFields(), requireDefectEditor(), unlinkDefect(), updateDefect(), DefectDetailPage() (+11 more)

### Community 54 - "Backup and Restore Routes"
Cohesion: 0.14
Nodes (17): dynamic, GET(), maxDuration, dynamic, maxDuration, POST(), BackupPage(), dynamic (+9 more)

### Community 55 - "Onboarding Wizard"
Cohesion: 0.16
Nodes (18): completeOnboarding(), ensureOrganization(), onboardingCreateProject(), onboardingIntegrations(), onboardingInvite(), TEMPLATE_SUITES, INTEGRATIONS, TEMPLATES (+10 more)

### Community 56 - "Run Realtime Events (SSE)"
Cohesion: 0.14
Nodes (17): dynamic, encoder, GET(), dynamic, POST(), pendingLeave, PresenceUser, ResultEvent (+9 more)

### Community 57 - "Indonesian Glossary Check"
Cohesion: 0.10
Nodes (15): Anda register rule (never kamu or -mu clitics), A term earns a glossary row only after being translated two ways, RETIRED_TERMS list, actionSrc, en7, enByTrack, end, grader (+7 more)

### Community 58 - "Playwright Reporter Package"
Cohesion: 0.10
Nodes (20): @playwright/test, @playwright/test, description, engines, node, exports, license, main (+12 more)

### Community 59 - "Icon and Bundle Check Scripts"
Cohesion: 0.14
Nodes (19): canaries(), chunks, expected, leaks, walk(), chunk(), crc32(), CRC_TABLE (+11 more)

### Community 60 - "Backup Core Self-Check"
Cohesion: 0.20
Nodes (18): { missing, unknown }, assertModelOrder(), buildBackup(), checkModelOrder(), clientKey(), dateFields(), isFresh(), MODEL_ORDER (+10 more)

### Community 61 - "Importers (Gherkin, TestLink)"
Cohesion: 0.16
Nodes (17): PARSERS, POST(), parseFeatureFile(), RawScenario, IMPORTANCE_MAP, mapImportance(), parseTestLinkXml(), TLCase (+9 more)

### Community 62 - "Help Center Content"
Cohesion: 0.23
Nodes (10): automation, gettingStarted, integrations, notifications, plans, reports, runs, team (+2 more)

### Community 63 - "Cypress Reporter Manifest"
Cohesion: 0.10
Nodes (19): cypress, optional, description, engines, node, exports, license, main (+11 more)

### Community 64 - "Pytest Plugin Client"
Cohesion: 0.15
Nodes (6): Minimal TestForge REST client for the pytest plugin.  Uses only the standard lib, TestForgeClient, pytest_configure(), pytest plugin that streams results to TestForge.  Creates a run at session start, _TestForgePlugin, TestForgeClient

### Community 65 - "Roles and Permissions"
Cohesion: 0.15
Nodes (14): ActionResult, createRole(), deleteRole(), readPermissions(), requireOrgAdmin(), updateRole(), dynamic, TeamPage() (+6 more)

### Community 66 - "OpenAPI v2 Spec"
Cohesion: 0.16
Nodes (18): GET(), bool, commonErrors, crudPaths(), dateTime, err(), idParam(), int (+10 more)

### Community 67 - "Attachment Uploader and Executor"
Cohesion: 0.16
Nodes (17): AttachmentItem, AttachmentUploader(), formatSize(), ExecutorStep, glyphFor(), KEY_ICONS, KIND_ICONS, relativeTime() (+9 more)

### Community 68 - "Team Management Actions"
Cohesion: 0.19
Nodes (14): adminContext(), changeMemberRole(), inviteTeam(), otherAdminCount(), removeMember(), resendInvite(), revokeInvite(), TeamResult (+6 more)

### Community 69 - "Run Execution UI Screenshot"
Cohesion: 0.17
Nodes (18): Case Execution Detail Panel (preconditions, numbered steps, expected result), Run Case Result List (TC-WEB-001..005 with status pills), Case Criticality Badge (CRITICAL), Defects Section of the Execution Panel, Elapsed Time and Remaining Estimate, Evidence Dropzone (drop, paste screenshot, or browse, max 10 MB), Export and Print View Actions, Global Sidebar Navigation (Dashboard, My Work, Projects, Team, API Keys, AI Assist, Audit Log, Backup, Account, Help) (+10 more)

### Community 70 - "Mock LDAP Fixture"
Cohesion: 0.12
Nodes (9): LDAP_BASE_DN, LDAP_SERVICE_DN, LDAP_SERVICE_PASSWORD, MockLdapControls, MockLdapUser, startMockLdap(), RFC-4515, TC (+1 more)

### Community 71 - "Package Keywords"
Cohesion: 0.13
Nodes (18): keywords, test-management, testforge, keywords, reporter, keywords, reporter, keywords (+10 more)

### Community 72 - "Playwright Reporter Implementation"
Cohesion: 0.15
Nodes (3): mapStatus(), TestForgeReporter, TestForgeClient

### Community 73 - "Academy Me and Sitemap"
Cohesion: 0.22
Nodes (14): AcademyMePage(), dynamic, metadata, getMyCertificates(), getMyExamAttempts(), dynamic, publicProjectEntries(), sitemap() (+6 more)

### Community 74 - "Cases Table Bulk Edit"
Cohesion: 0.14
Nodes (14): bulkDeleteCases(), bulkUpdateCases(), reorderCases(), AUTOMATION_LABELS, CaseRow, CasesTable(), applyBulkEdit(), confirmDelete() (+6 more)

### Community 75 - "Issues Actions and Routes"
Cohesion: 0.21
Nodes (14): ActionResult, createIssueFromResult(), resolveIntegration(), DELETE(), findProject(), GET(), POST(), displayIssueKey() (+6 more)

### Community 76 - "Project Members"
Cohesion: 0.19
Nodes (13): addProjectMember(), changeProjectMemberRole(), isValidRole(), manageContext(), ownerCount(), ProjectMemberResult, removeProjectMember(), VALID_ROLES (+5 more)

### Community 77 - "Saved Views and Export Menu"
Cohesion: 0.20
Nodes (12): createSavedView(), deleteSavedView(), toggleDefaultSavedView(), dynamic, ExportMenu(), NewSuiteForm(), SavedViewItem, SavedViewsMenu() (+4 more)

### Community 78 - "Offline Queue"
Cohesion: 0.20
Nodes (17): genClientId(), performSubmit(), allPending(), bumpTries(), Conflict, count(), emit(), enqueue() (+9 more)

### Community 79 - "Academy Redesign Directions"
Cohesion: 0.16
Nodes (16): Academy Redesign Directions, Arah 01 — Reader (three-column course player), Arah 03 — Studio (theory left, sandbox right), Arah 04 — Editorial (typography, hairlines, space; chosen), Recommendation — frame of Arah 1, typography of Arah 4, panel of Arah 3, Six flaws in the current Academy layout, Fable design handoff appendix, Design judgment rules (dense/quiet/functional, one accent, legible without colour) (+8 more)

### Community 80 - "API Client Manifest"
Cohesion: 0.12
Nodes (16): description, engines, node, exports, license, main, name, repository (+8 more)

### Community 81 - "CLI Package Manifest"
Cohesion: 0.12
Nodes (16): bin, testforge, dependencies, yaml, description, engines, node, license (+8 more)

### Community 82 - "Beyond Track Content"
Cohesion: 0.17
Nodes (9): aiInQa, contractTesting, beyond, interviewPrep, performanceTesting, portfolio, securityForTesters, testingInProduction (+1 more)

### Community 83 - "API Client Codegen"
Cohesion: 0.23
Nodes (15): arg(), collectOperations(), emitClient(), emitClientTypes(), emitTypes(), here, loadSpec(), methodName() (+7 more)

### Community 84 - "Badge and Webhooks"
Cohesion: 0.18
Nodes (9): enableBadge(), revokeBadge(), createWebhook(), deleteWebhook(), CodeBlock(), FRAMEWORKS, Hook, WebhookManager() (+1 more)

### Community 85 - "Suite Tree Operations"
Cohesion: 0.17
Nodes (10): moveCases(), deleteSuite(), DeleteSuiteButton(), SuiteDropZone(), onDrop(), ancestorsOf(), filterTree(), idsWithChildren() (+2 more)

### Community 86 - "Case Form Components"
Cohesion: 0.19
Nodes (10): SharedGroupOption, CustomDefItem, CustomFieldInputs(), MemberOption, GherkinBlock(), LINE_CLASS, MarkdownEditor(), GherkinLineType (+2 more)

### Community 87 - "ISTQB Track Content"
Cohesion: 0.18
Nodes (8): ch1Fundamentals, ch2Sdlc, ch3StaticTesting, ch4TestAnalysisDesign, ch5ManagingTestActivities, ch6TestTools, examStrategy, istqb

### Community 88 - "Indonesian Beyond Translations"
Cohesion: 0.18
Nodes (8): aiInQaId, contractTestingId, beyondId, interviewPrepId, performanceTestingId, portfolioId, securityForTestersId, testingInProductionId

### Community 89 - "Indonesian ISTQB Translations"
Cohesion: 0.18
Nodes (8): ch1FundamentalsId, ch2SdlcId, ch3StaticTestingId, ch4TestAnalysisDesignId, ch5ManagingTestActivitiesId, ch6TestToolsId, examStrategyId, istqbId

### Community 90 - "Runtime Dependencies"
Cohesion: 0.13
Nodes (15): adm-zip, bcryptjs, fast-xml-parser, next, dependencies, adm-zip, bcryptjs, fast-xml-parser (+7 more)

### Community 91 - "Cases-as-Code Rationale"
Cohesion: 0.13
Nodes (15): Canonical YAML case format, Determinism as an acceptance criterion, Shared steps expand on pull and break the link on push, Three standalone fixes regardless of direction, F-38 — Public project sharing / portfolio mode, Anonymous users need no DB rows (localStorage + signed HMAC ticket), claimAcademyProgress — claim anonymous progress at signup, ExamAttempt model (seed + questionIdsJson reproduce the paper) (+7 more)

### Community 92 - "TOTP Fixtures and Self-Test"
Cohesion: 0.17
Nodes (10): base32Decode(), totp(), TC, base32Decode(), hotp(), secret, seed, totpAt() (+2 more)

### Community 93 - "Attachment Storage Routes"
Cohesion: 0.29
Nodes (10): GET(), GET(), ATTACHMENT_ENTITY_TYPES, headerFilename(), INLINE_IMAGE_MIMES, removeAttachments(), sanitizeFilename(), sweepOrphanAttachments() (+2 more)

### Community 94 - "Baseline Comparison"
Cohesion: 0.23
Nodes (11): GET(), GET(), POST(), BaselineDetailPage(), serializeBaseline(), BaselineComparisonRow, BaselineEntryStatus, buildSuitePathMap() (+3 more)

### Community 95 - "Docs Feature Catalog"
Cohesion: 0.15
Nodes (14): Test Cases as Code (L-03), Arah 02 — Jalur (route/momentum, gamified), TestForge — Consolidated Project Documentation, F-07 — Issue tracker integration (Jira, GitHub, GitLab), L-03 — Test cases as code (GitOps sync), Correct answers must never reach the browser, Content lives in git, state lives in the DB, Deliberate exclusions (video, CMS, leaderboards/streaks, paid tiers) (+6 more)

### Community 96 - "Integrations E2E and Crypto"
Cohesion: 0.23
Nodes (8): MockState, TC, appSecret(), decrypt(), encrypt(), isEncrypted(), key(), isIssueClosed()

### Community 97 - "Account Password Change"
Cohesion: 0.23
Nodes (10): changePassword(), changePassword(), isWeakPassword(), AccountPage(), dynamic, ChangePasswordForm(), TwoFactorSettings(), hashPassword() (+2 more)

### Community 98 - "CLI Sync Gaps and Fixes"
Cohesion: 0.15
Nodes (13): F-HIGH-1 — T3 lessons teach nonexistent TestForge endpoints, WP-2 — correct the T3 endpoint inaccuracy, cases pull command, cases push command (3-way merge), cases status command, baseRev optimistic concurrency with item-level atomicity, POST /api/v1/projects/{slug}/cases/sync, .testforge.lock sync-state base snapshot (+5 more)

### Community 99 - "NPM Scripts"
Cohesion: 0.15
Nodes (13): scripts, build, check:theme, db:push, dev, e2e, e2e:upload, lint (+5 more)

### Community 100 - "Cypress Reporter Implementation"
Cohesion: 0.23
Nodes (3): mapState(), registerTestForge(), TestForgeClient

### Community 101 - "API Keys Management"
Cohesion: 0.23
Nodes (7): createApiKey(), deleteApiKey(), ApiKeysPage(), dynamic, ApiKeyCreator(), CopyButton(), DeleteApiKeyButton()

### Community 102 - "Custom Field Definitions"
Cohesion: 0.29
Nodes (9): assertFieldAdmin(), createFieldDef(), moveFieldDef(), parseOptionsInput(), toggleFieldActive(), updateFieldDef(), CustomFieldsManager(), FieldDefItem (+1 more)

### Community 103 - "Issue Panel UI"
Cohesion: 0.21
Nodes (10): linkIssue(), previewIssueFromResult(), unlinkIssue(), CreateIssueModal(), displayKey(), isClosed(), IssueBadges(), IssueLinkView (+2 more)

### Community 104 - "OIDC Login"
Cohesion: 0.32
Nodes (9): GET(), loginError(), base64url(), GET(), createSession(), Discovery, getDiscovery(), getJwks() (+1 more)

### Community 105 - "Shared Steps API"
Cohesion: 0.28
Nodes (11): DELETE(), findScoped(), PATCH(), GET(), POST(), readBodySteps(), apiError(), unauthorized() (+3 more)

### Community 106 - "Exam Engine"
Cohesion: 0.21
Nodes (12): getQuestions(), ExamBlueprint, BankQuestion, beginAttempt(), drawQuestionIdsFor(), GradedAttempt, GradedVerdict, presentPaper (+4 more)

### Community 107 - "TestRail Importer"
Cohesion: 0.22
Nodes (12): mapPriority(), mapType(), parseTestRailXml(), PRIORITY_BY_ID, PRIORITY_BY_NAME, TRCase, TRDoc, TRSection (+4 more)

### Community 108 - "Docker Estate Rules"
Cohesion: 0.18
Nodes (12): Never docker compose down -v on stateful apps, Production-readiness checklist (generic reference), TestForge estate entry (testforge.emha.space, /opt/testforge, testforge:3000), Dockerfile review checklist (multi-stage, node:22-alpine, non-root, HEALTHCHECK), EMHA Docker estate conventions, Fixed internal ports per app, Named volumes are pinned and sacred, LDAP / Active Directory env reference (F-34) (+4 more)

### Community 109 - "Indonesian Glossary Rules"
Cohesion: 0.18
Nodes (12): TestForge QA Academy — Indonesian Glossary, One canonical form per concept (retired spellings build-enforced), Formal register kept (berkas / basis data / unggah / unduh), Standing rule: common English QA terms stay English, Appendix A — lone-backslash escape scans, Appendix B — numeric-token scan (review aid, not a build assertion), F-MED-1 — 'bug report' has three competing Indonesian translations, F-MED-4 — lost backslash escapes in the Indonesian tree (+4 more)

### Community 110 - "Indonesian Academy Decisions"
Cohesion: 0.18
Nodes (12): Localised links: /id/academy/… with English slugs, DECISION-1 — Indonesian exam links to the English simulator, OBS-1 — QA-ACADEMY §4 curriculum disagrees with shipped content, OBS-2 — certificate serial dev-secret fallback, WP-4 — decisions and small hardenings, i18n convention (tf_lang cookie on public pages, app UI English-only), A-07 — Certificates & shareable badge, A-10 — Exam integrity (answer-key balance, single-use tickets, resumable attempts) (+4 more)

### Community 111 - "Backup Restore E2E"
Cohesion: 0.17
Nodes (4): PNG_1PX, RunResult, TC, ./src/lib/crypto-core.mjs

### Community 112 - "Exam Core Self-Test"
Cohesion: 0.27
Nodes (8): FULL_EXAM_CHAPTERS, drawQuestionIds(), gradeAttempt(), isLate(), mulberry32(), presentPaper(), seededShuffle(), seedToState()

### Community 113 - "Configurations Manager"
Cohesion: 0.29
Nodes (8): ActionResult, addConfigOption(), createConfigGroup(), deleteConfigGroup(), deleteConfigOption(), requireConfigAdmin(), ConfigGroupView, ConfigurationsManager()

### Community 114 - "Shared Steps Manager"
Cohesion: 0.29
Nodes (7): createSharedGroup(), deleteSharedGroup(), readSteps(), updateSharedGroup(), SharedGroupItem, SharedStepsManager(), can()

### Community 115 - "ISTQB Syllabus Objectives"
Cohesion: 0.21
Nodes (9): CHAPTER_TITLES, ChapterNumber, KLevel, OBJECTIVES_BY_ID, SYLLABUS_OBJECTIVES, SyllabusObjective, CHAPTER_TITLES, OBJECTIVES_BY_ID (+1 more)

### Community 116 - "Qase Importer"
Cohesion: 0.21
Nodes (11): buildSuitePath(), mapPriority(), mapType(), parseQaseJson(), PRIORITY_MAP, QaseCase, QaseDoc, QaseStep (+3 more)

### Community 117 - "Academy Audit Method"
Cohesion: 0.24
Nodes (11): TestForge QA Academy — Content Audit, Mandatory API v1 pattern (guard, apiError envelope, serializers, cursor pagination, OpenAPI), Definition of Done, Which model to use for AI implementers, No Prisma enum, no Json type — PostgreSQL portability rule, Part IV — Feature Work Orders, Repo conventions every feature MUST follow, Mandatory server-action pattern (auth → RBAC → tenant guard → validate → mutate → audit → revalidate) (+3 more)

### Community 118 - "Cases-as-Code E2E"
Cohesion: 0.20
Nodes (6): Ctx, db, ROOT, snapshot(), TC, yamlFiles()

### Community 119 - "Package Files Lists"
Cohesion: 0.20
Nodes (11): files, files, README.md, files, index.js, lib, files, lib (+3 more)

### Community 120 - "Projects and Suites Actions"
Cohesion: 0.29
Nodes (7): archiveProject(), createMilestone(), createProject(), createSuite(), slugify(), NewProjectForm(), isProjectMember()

### Community 121 - "CSV Case Import"
Cohesion: 0.27
Nodes (9): CsvRow, POST(), readCustomCells(), validateRow(), parseDuration(), applyColumnMapping(), ColumnMapping, CSV_TARGET_FIELDS (+1 more)

### Community 122 - "My Work Page"
Cohesion: 0.25
Nodes (9): dynamic, MyWorkPage(), PRIORITY_BADGES, RESULT_BADGES, STATUS_BADGES, loadMyWork(), loadMyWorkCounts(), mineScope() (+1 more)

### Community 123 - "Case Dependencies API"
Cohesion: 0.38
Nodes (8): GET(), POST(), resolveCase(), POST(), badRequest(), serializeCaseDependency(), detectFormat(), RESULT_FORMATS

### Community 124 - "Quality Badge SVG"
Cohesion: 0.29
Nodes (9): computeMetric(), DEFAULT_LABELS, dynamic, esc(), GET(), Metric, METRICS, rampColor() (+1 more)

### Community 125 - "Monorepo Workspaces"
Cohesion: 0.22
Nodes (8): name, private, version, workspaces, packages/api-client, packages/cli, packages/cypress-reporter, packages/playwright-reporter

### Community 126 - "Certificate Serial Self-Test"
Cohesion: 0.36
Nodes (6): BASE, deriveSerial(), normalizeSerial(), SERIAL_ALPHABET, SERIAL_PATTERN, SERIAL_SYMBOLS

### Community 127 - "Palette Token Check"
Cohesion: 0.22
Nodes (6): ACCENT_TOKENS, css, CSS_LESS, idBlock, ids, theme

### Community 128 - "Share Links"
Cohesion: 0.36
Nodes (6): createShareLink(), entityProject(), EXPIRY_DAYS, revokeShareLink(), CopyLinkButton(), ShareLinkPanel()

### Community 129 - "Public Cases Browser"
Cohesion: 0.28
Nodes (7): PublicCasesPage(), revalidate, SearchParams, SuiteNode, SuiteFolder, SuiteFolderGrid(), parseTags()

### Community 130 - "Case History and Revisions"
Cohesion: 0.25
Nodes (6): CaseHistory(), FIELDS, RevisionView, scalarText(), Snapshot, SnapshotStep

### Community 131 - "LDAP Client"
Cohesion: 0.28
Nodes (8): attr(), authenticateLdap(), buildUserFilter(), LdapConfig, ldapEnabled(), LdapResult, LdapUser, RFC-4515

### Community 132 - "Storage Driver"
Cohesion: 0.28
Nodes (3): LocalDriver, resolveSafe(), StorageDriver

### Community 133 - "Caddy Front Door Ops"
Cohesion: 0.25
Nodes (8): Adding a new app to the estate, Caddyfile bind-mount inode swap (gotcha #2), emha-caddy shared front door, No wildcard DNS — per-subdomain A record (gotcha #5), Tokopudidi --env-file .env.production requirement (gotcha #1), Caddyfile bind-mounted as a single file, .env auto-load vs --env-file, Smoke test step (testforge.emha.space via shared Caddy)

### Community 134 - "Build-Time Env Baking"
Cohesion: 0.25
Nodes (8): EMHA Universe Estate, NEXT_PUBLIC_* baked at build time (gotcha #4), Next build step with NEXT_PUBLIC_* env, Production build args (NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_GITHUB_REPO), Instructions for AI agents, Test cases as code (GitOps, testforge-cli), docs/DOCUMENTATION.md (consolidated project documentation), Git & deploy workflow (branch → PR → CI → merge)

### Community 135 - "Superadmin and Sandbox Gaps"
Cohesion: 0.25
Nodes (8): F-41 — Instance console: registered users (/superadmin), A-11 — Sandbox checkers for the remaining eight, Checker brittleness — forgiving about wording, strict about structure, AcademyCoach overlay + verifyTask checkers, Option C — hybrid placement of the Academy, Academy route map, Academy sandbox (ensureSandbox, ShopMini fixture, kind ACADEMY_SANDBOX), ShopMini — the single running example

### Community 136 - "Quality Gate E2E"
Cohesion: 0.25
Nodes (4): db, Fixture, ROOT, TC

### Community 137 - "Realtime Run E2E"
Cohesion: 0.29
Nodes (3): login(), newUserPage(), TC

### Community 138 - "Restore Script"
Cohesion: 0.25
Nodes (6): args, db, file, flags, forceWipe, yes

### Community 139 - "Cucumber Result Parser"
Cohesion: 0.29
Nodes (7): CucumberElement, CucumberFeature, CucumberStep, CucumberStepResult, parseCucumber(), SEVERITY, statusForSteps()

### Community 140 - "CI Build Gates"
Cohesion: 0.29
Nodes (7): CI build gate job, Prisma generate step, Theme token guard step (npm run check:theme), CI quality gates (per-project pass-rate policy), Automation results upload API (POST /api/v1/results), SQLite default, PostgreSQL for production, TestForge (open source test case management platform)

### Community 141 - "Audit Assurance Rules"
Cohesion: 0.29
Nodes (3): Already assured by the build (do not re-audit by hand), Six-pass audit method (baseline, pair read, terminology sweep, mechanical scans, claim verification, sampling), tracks

### Community 142 - "API v2 E2E"
Cohesion: 0.29
Nodes (4): db, keyIds, KeyOpts, RUN

### Community 144 - "Defect Panel UI"
Cohesion: 0.29
Nodes (6): createAndLinkDefect(), linkDefectToEntity(), DefectLinkView, DefectPanel(), ProjectDefectOption, STATUS_BADGE

### Community 145 - "API Docs Page"
Cohesion: 0.33
Nodes (4): dynamic, metadata, VERSIONS, ApiDocs()

### Community 146 - "Site OG Image"
Cohesion: 0.29
Nodes (5): alt, contentType, ROWS, runtime, size

### Community 147 - "NUnit Result Parser"
Cohesion: 0.33
Nodes (6): collectCases(), NUnitDoc, NUnitFailure, NUnitTestCase, NUnitTestSuite, statusFor()

### Community 148 - "Deploy Pipeline Shape"
Cohesion: 0.40
Nodes (6): Per-repo CI/CD shape (ci.yml + deploy.yml + VPS secrets), VPS has no GitHub creds — CI pushes code in (gotcha #6), Build & up on VPS step, Deploy job (rsync + compose up on VPS), Sync source to VPS step (rsync --delete), SQLite state lives in testforge_data, not the source tree

### Community 149 - "Shared Docker Network"
Cohesion: 0.33
Nodes (6): emha_shared external docker network, Debugging containers on the VPS, Join emha_shared as external, publish no host ports, Nightly staleness check job, Nightly-schedule deploy policy (02:00 WIB, skip if no new commits), emha_shared external network declaration (prod)

### Community 153 - "JUnit Upload Script"
Cohesion: 0.33
Nodes (3): ORIGIN, slug, xml

### Community 154 - "Issue Status Sync"
Cohesion: 0.53
Nodes (4): GET(), sleep(), syncIssueStatuses(), SyncReport

### Community 155 - "OpenAPI v1 Spec"
Cohesion: 0.53
Nodes (4): GET(), err(), openApiSpec(), slugParam

### Community 156 - "TRX Result Parser"
Cohesion: 0.40
Nodes (5): parseTrx(), parseTrxDuration(), TrxDoc, TrxUnitTest, TrxUnitTestResult

### Community 157 - "Superadmin Env Contract"
Cohesion: 0.40
Nodes (5): TF_SUPERADMIN_* env contract (dormant unless set), testforge development compose service, testforge-data named volume (dev), One-command Docker setup (PRD §5.4), Instance console /superadmin (F-41)

### Community 158 - "Competitor Comparison"
Cohesion: 0.40
Nodes (5): Gap Analysis → TODO features, Qase (competitor), Test IO (crowdtesting service, not a TCM), TestLink (competitor), TestRail (competitor)

### Community 160 - "Mock OIDC Fixture"
Cohesion: 0.60
Nodes (3): MockOidcControls, startMockOidc(), TC

### Community 161 - "Importers E2E"
Cohesion: 0.50
Nodes (3): fixture(), TC, uploadFixture()

### Community 166 - "App Icon 192px"
Cohesion: 0.70
Nodes (5): Anvil-and-Pen Brand Mark, TestForge App Icon 192px, Flat White Monochrome Glyph Style, Indigo Rounded-Square Tile Treatment, PWA Manifest Icon Asset (192x192)

### Community 167 - "App Icon 512px"
Cohesion: 0.50
Nodes (5): Anvil-Pencil Composite Mark, TestForge App Icon (512px), Indigo Rounded-Square Brand Surface, PWA Install Icon Asset, Spark Accent Strokes

### Community 168 - "Maskable App Icon"
Cohesion: 0.60
Nodes (5): TestForge 512px Maskable App Icon, Anvil-and-Sparks Brand Mark, Indigo Brand Background Color, PWA Manifest Icon Asset, Maskable Icon Safe-Zone Layout

### Community 169 - "Onboarding Page"
Cohesion: 0.40
Nodes (4): dynamic, metadata, OnboardingPage(), OnboardingWizard()

### Community 177 - "Session Integrity E2E"
Cohesion: 0.67
Nodes (3): db, mintStaleSessionToken(), readAuthSecret()

### Community 178 - "ESLint Config"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 179 - "Prisma Seed"
Cohesion: 0.67
Nodes (3): backfillCertificateHolders(), db, main()

### Community 180 - "Logout Action"
Cohesion: 0.50
Nodes (3): logout(), LogoutButton(), clearSession()

### Community 181 - "Favicon Brand Mark"
Cohesion: 0.67
Nodes (4): Anvil and Hammer Motif, TestForge App Icon / Brand Mark, Forge Spark Accents, Indigo Rounded-Square Favicon

### Community 190 - "README Feature Highlights"
Cohesion: 0.67
Nodes (3): Public project sharing / portfolio mode (F-38), QA Academy (/academy), Live quality badge (/badge/<token>.svg)

## Ambiguous Edges - Review These
- `emha_shared external docker network` → `Nightly-schedule deploy policy (02:00 WIB, skip if no new commits)`  [AMBIGUOUS]
  .github/workflows/deploy.yml · relation: references
- `emha_shared external docker network` → `emha_shared external network declaration (prod)`  [AMBIGUOUS]
  docker-compose.prod.yml · relation: references
- `CI build gate job` → `Automation results upload API (POST /api/v1/results)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to
- `Localised links: /id/academy/… with English slugs` → `i18n convention (tf_lang cookie on public pages, app UI English-only)`  [AMBIGUOUS]
  docs/DOCUMENTATION.md · relation: conceptually_related_to
- `Mandatory API v1 pattern (guard, apiError envelope, serializers, cursor pagination, OpenAPI)` → `T3 capstone — /api/v1/junit upload verified in the sandbox`  [AMBIGUOUS]
  docs/QA-ACADEMY.md · relation: conceptually_related_to
- `TestForge REST API v2` → `Quality Gate policy (Fields → Quality Gate)`  [AMBIGUOUS]
  packages/cli/README.md · relation: conceptually_related_to
- `Test Case Table` → `AI Assist Nav Item`  [AMBIGUOUS]
  docs/images/cases.png · relation: conceptually_related_to
- `Needs My Review Filter` → `Case Versioning Marker (v2 in title)`  [AMBIGUOUS]
  docs/images/cases.png · relation: conceptually_related_to
- `Flakiness Definition (pass/fail status flips between runs, >=2 changes)` → `TC-WEB-003 Lockout setelah 5 kali gagal login`  [AMBIGUOUS]
  docs/images/reports.png · relation: conceptually_related_to
- `Muted Case Status (failure excluded from the pass bar)` → `Rerun Failed Action (count-badged)`  [AMBIGUOUS]
  docs/images/run.png · relation: conceptually_related_to

## Knowledge Gaps
- **857 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `TC`, `PNG_1PX`, `TC` (+852 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `emha_shared external docker network` and `Nightly-schedule deploy policy (02:00 WIB, skip if no new commits)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `emha_shared external docker network` and `emha_shared external network declaration (prod)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `CI build gate job` and `Automation results upload API (POST /api/v1/results)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Localised links: /id/academy/… with English slugs` and `i18n convention (tf_lang cookie on public pages, app UI English-only)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Mandatory API v1 pattern (guard, apiError envelope, serializers, cursor pagination, OpenAPI)` and `T3 capstone — /api/v1/junit upload verified in the sandbox`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TestForge REST API v2` and `Quality Gate policy (Fields → Quality Gate)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Test Case Table` and `AI Assist Nav Item`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._