import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CsvImporter } from "@/components/CsvImporter";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({ where: { slug: params.slug } });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="import" />

      <div className="grid gap-6 lg:grid-cols-2">
        <CsvImporter projectSlug={project.slug} />

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 font-semibold">🤖 Upload Hasil Automation (CI/CD)</h3>
          <p className="mb-3 text-sm text-slate-500">
            Upload file JUnit XML dari framework apa pun (Cypress, Playwright,
            Jest, Pytest, dll). Hasil otomatis menjadi test run baru, dan test
            di-match ke test case via anotasi{" "}
            <code className="rounded bg-slate-100 px-1">TC-{project.slug.toUpperCase()}-XXX</code>{" "}
            di nama test, atau via judul yang sama.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
{`# 1. Buat API key di Settings → API Keys
# 2. Upload dari pipeline CI:

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
            Endpoint REST lain:{" "}
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
