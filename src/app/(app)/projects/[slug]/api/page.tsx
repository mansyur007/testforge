import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function ApiPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="api" />

      <div className="max-w-2xl">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><TFIcon name="automation" className="h-5 w-5" /> Upload Automation Results (CI/CD)</h3>
          <p className="mb-3 text-sm text-slate-500">
            Upload a JUnit XML file from any framework (Cypress, Playwright,
            Jest, Pytest, etc.). Results automatically become a new test run, and
            tests are matched to test cases via a{" "}
            <code className="rounded bg-slate-100 px-1">TC-{project.slug.toUpperCase()}-XXX</code>{" "}
            annotation in the test name, or by an identical title.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
{`# 1. Create an API key in Settings → API Keys
# 2. Upload from your CI pipeline:

curl -X POST \\
  ${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/v1/junit \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/xml" \\
  -G -d "project=${project.slug}" \\
  -d "name=CI Run \${"$"}{GITHUB_RUN_NUMBER}" \\
  -d "source=cypress" \\
  --data-binary @results/junit.xml`}
          </pre>
          <p className="mt-3 text-xs text-slate-400">
            Other REST endpoints:{" "}
            <code className="rounded bg-slate-100 px-1">
              GET /api/v1/projects/{project.slug}/cases
            </code>{" "}
            ·{" "}
            <code className="rounded bg-slate-100 px-1">
              POST /api/v1/projects/{project.slug}/cases
            </code>
          </p>
        </section>
      </div>
    </div>
  );
}
