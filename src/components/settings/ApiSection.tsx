import { notFound } from "next/navigation";
import Link from "next/link";
import { TFIcon, BrandIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { CodeBlock } from "@/components/CodeBlock";
import { WebhookManager } from "@/components/WebhookManager";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { enableBadge, revokeBadge } from "@/app/actions/badge";
import type { SectionProps } from "@/lib/section-props";

const FRAMEWORKS = [
  { id: "cypress", name: "Cypress" },
  { id: "playwright", name: "Playwright" },
  { id: "jest", name: "Jest" },
  { id: "pytest", name: "Pytest" },
  { id: "selenium", name: "Selenium" },
  { id: "k6", name: "k6" },
];

export async function ApiSection({
  params,
}: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const webhooks = await db.webhook.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, events: true, secret: true, active: true },
  });

  // L-01: active = row exists and not revoked (revoke keeps the row; re-enable
  // rotates the token in place).
  const badgeToken = await db.badgeToken.findUnique({
    where: { projectId: project.id },
    select: { token: true, revokedAt: true },
  });
  const badgeActive = badgeToken != null && badgeToken.revokedAt == null;

  const slug = project.slug;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const curl = `curl -X POST \\
  ${baseUrl}/api/v1/junit \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/xml" \\
  -G -d "project=${slug}" \\
  -d "name=CI Run \${GITHUB_RUN_NUMBER}" \\
  -d "source=cypress" \\
  --data-binary @results/junit.xml`;

  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/junit",
      desc: "Upload JUnit XML as a new test run",
    },
    {
      method: "GET",
      path: `/api/v1/projects/${slug}/cases`,
      desc: "List all test cases",
    },
    {
      method: "POST",
      path: `/api/v1/projects/${slug}/cases`,
      desc: "Create a test case",
    },
  ];

  return (
    <div className="space-y-6">

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="cicd" className="h-5 w-5" /> Upload automation results
            </h3>
            <p className="mt-1 text-sm text-content-muted">
              Push a JUnit XML report from any CI pipeline. Results become a new
              test run, with tests matched to cases by a{" "}
              <code className="rounded bg-surface-muted px-1 text-xs">
                TC-{slug.toUpperCase()}-XXX
              </code>{" "}
              annotation in the test name, or by an identical title.
            </p>

            <ol className="mt-4 space-y-2.5 text-sm text-content">
              <li className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-soft-fg">
                  1
                </span>
                <span>
                  Create an API key in{" "}
                  <Link
                    href="/settings/api-keys"
                    className="font-medium text-accent-text hover:underline"
                  >
                    Settings → API Keys
                  </Link>
                  .
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-soft-fg">
                  2
                </span>
                <span>Add this step to your CI pipeline:</span>
              </li>
            </ol>

            <div className="mt-3">
              <CodeBlock code={curl} />
            </div>
          </section>

          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="frameworks" className="h-5 w-5" /> REST endpoints
            </h3>
            <div className="mt-4 divide-y divide-hairline-subtle">
              {endpoints.map((e) => (
                <div
                  key={e.method + e.path}
                  className="flex items-start gap-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 w-12 shrink-0 rounded-md py-0.5 text-center text-[10px] font-bold ${
                      e.method === "GET"
                        ? "bg-success-soft text-success-soft-fg"
                        : "bg-accent-soft text-accent-soft-fg"
                    }`}
                  >
                    {e.method}
                  </span>
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-xs text-content">
                      {e.path}
                    </code>
                    <p className="text-xs text-content-subtle">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="cicd" className="h-5 w-5" /> Webhooks
            </h3>
            <p className="mt-1 text-sm text-content-muted">
              Get a signed <code className="rounded bg-surface-muted px-1 text-xs">POST</code>{" "}
              when cases change or a run completes.
            </p>
            <div className="mt-4">
              <WebhookManager
                projectId={project.id}
                webhooks={webhooks}
                availableEvents={WEBHOOK_EVENTS}
              />
            </div>
          </section>

          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="trend" className="h-5 w-5" /> Quality badge
            </h3>
            <p className="mt-1 text-sm text-content-muted">
              A public shields.io-style SVG showing this project&apos;s latest
              pass rate — embed it in a README or wiki. The URL token is the
              only auth; revoke it anytime.
            </p>
            {badgeActive ? (
              <div className="mt-4 space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badge/${badgeToken.token}.svg`}
                  alt="Quality badge preview"
                  data-testid="badge-preview"
                  data-token={badgeToken.token}
                  className="h-5"
                />
                <CodeBlock
                  code={`![pass rate](${baseUrl}/badge/${badgeToken.token}.svg)`}
                />
                <p className="text-xs text-content-subtle">
                  Variants:{" "}
                  <code className="rounded bg-surface-muted px-1">?metric=automation</code>{" "}
                  (automation coverage),{" "}
                  <code className="rounded bg-surface-muted px-1">?metric=cases</code>{" "}
                  (case count),{" "}
                  <code className="rounded bg-surface-muted px-1">&amp;label=…</code>{" "}
                  (custom label);{" "}
                  <code className="rounded bg-surface-muted px-1">.json</code> serves
                  the shields.io endpoint schema.
                </p>
                <form action={revokeBadge}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    data-testid="badge-revoke-button"
                    className="rounded-lg border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    Revoke badge
                  </button>
                </form>
              </div>
            ) : (
              <form action={enableBadge} className="mt-4">
                <input type="hidden" name="projectId" value={project.id} />
                <button
                  data-testid="badge-enable-button"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Enable badge
                </button>
              </form>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-hairline bg-surface p-6">
            <h4 className="text-sm font-semibold text-content">
              Supported frameworks
            </h4>
            <p className="mt-1 text-xs text-content-subtle">
              Anything that emits JUnit XML.
            </p>
            <div className="mt-4 space-y-1.5">
              {FRAMEWORKS.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <BrandIcon name={f.id} className="h-5 w-5" />
                  </span>
                  <span className="truncate text-sm text-content">
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-accent-ring bg-accent-soft/60 p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-accent-soft-fg">
              <TFIcon name="nav-keys" className="h-5 w-5" /> Authentication
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-accent-soft-fg/70">
              Every endpoint expects a{" "}
              <code className="rounded bg-surface/70 px-1">Bearer</code> API key.
              Keys are project-scoped and can be revoked at any time.
            </p>
            <Link
              href="/settings/api-keys"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
            >
              Manage API keys →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
