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
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="cicd" className="h-5 w-5" /> Upload automation results
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Push a JUnit XML report from any CI pipeline. Results become a new
              test run, with tests matched to cases by a{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">
                TC-{slug.toUpperCase()}-XXX
              </code>{" "}
              annotation in the test name, or by an identical title.
            </p>

            <ol className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                  1
                </span>
                <span>
                  Create an API key in{" "}
                  <Link
                    href="/settings/api-keys"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    Settings → API Keys
                  </Link>
                  .
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                  2
                </span>
                <span>Add this step to your CI pipeline:</span>
              </li>
            </ol>

            <div className="mt-3">
              <CodeBlock code={curl} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="frameworks" className="h-5 w-5" /> REST endpoints
            </h3>
            <div className="mt-4 divide-y divide-slate-100">
              {endpoints.map((e) => (
                <div
                  key={e.method + e.path}
                  className="flex items-start gap-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 w-12 shrink-0 rounded-md py-0.5 text-center text-[10px] font-bold ${
                      e.method === "GET"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {e.method}
                  </span>
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-xs text-slate-700">
                      {e.path}
                    </code>
                    <p className="text-xs text-slate-400">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="cicd" className="h-5 w-5" /> Webhooks
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Get a signed <code className="rounded bg-slate-100 px-1 text-xs">POST</code>{" "}
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

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="trend" className="h-5 w-5" /> Quality badge
            </h3>
            <p className="mt-1 text-sm text-slate-500">
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
                <p className="text-xs text-slate-400">
                  Variants:{" "}
                  <code className="rounded bg-slate-100 px-1">?metric=automation</code>{" "}
                  (automation coverage),{" "}
                  <code className="rounded bg-slate-100 px-1">?metric=cases</code>{" "}
                  (case count),{" "}
                  <code className="rounded bg-slate-100 px-1">&amp;label=…</code>{" "}
                  (custom label);{" "}
                  <code className="rounded bg-slate-100 px-1">.json</code> serves
                  the shields.io endpoint schema.
                </p>
                <form action={revokeBadge}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    data-testid="badge-revoke-button"
                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
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
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Enable badge
                </button>
              </form>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h4 className="text-sm font-semibold text-slate-700">
              Supported frameworks
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Anything that emits JUnit XML.
            </p>
            <div className="mt-4 space-y-1.5">
              {FRAMEWORKS.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <BrandIcon name={f.id} className="h-5 w-5" />
                  </span>
                  <span className="truncate text-sm text-slate-600">
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
              <TFIcon name="nav-keys" className="h-5 w-5" /> Authentication
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-indigo-900/70">
              Every endpoint expects a{" "}
              <code className="rounded bg-white/70 px-1">Bearer</code> API key.
              Keys are project-scoped and can be revoked at any time.
            </p>
            <Link
              href="/settings/api-keys"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
            >
              Manage API keys →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
