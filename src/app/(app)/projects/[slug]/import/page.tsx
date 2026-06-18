import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CsvImporter } from "@/components/CsvImporter";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    t: "Download the template",
    d: "Start from the sample CSV with the right columns and an example row.",
  },
  {
    t: "Fill in your test cases",
    d: "One row per case. Separate steps with “|”, and add a per-step expected result after “::”.",
  },
  {
    t: "Preview & validate",
    d: "Every row is checked and any problems are flagged before anything is saved.",
  },
  {
    t: "Import valid rows",
    d: "Confirm to create the cases — optionally straight into a chosen suite.",
  },
];

export default async function ImportPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="import" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CsvImporter
            projectSlug={project.slug}
            suites={project.suites.map((s) => ({
              id: s.id,
              name: s.name,
              parentId: s.parentId,
            }))}
          />
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TFIcon name="checklist" className="h-5 w-5" /> How it works
          </h4>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.t}</p>
                  <p className="text-xs leading-relaxed text-slate-400">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
