import Link from "next/link";
import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CsvImporter } from "@/components/CsvImporter";
import { ToolImporter } from "@/components/ToolImporter";

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

// F-22: TestRail/Qase/TestLink each carry a suite hierarchy, so their
// "how it works" panel differs from the CSV flow above.
const TOOL_STEPS = [
  { t: "Export from your current tool", d: "TestRail: XML suite export. Qase: JSON case export. TestLink: XML test-suite export." },
  { t: "Upload & preview", d: "Every case and its detected suite path, priority, and warnings are shown before anything is saved." },
  { t: "Import", d: "Suites are created by path (nested sections become nested suites) and cases land under them." },
];

const TABS = [
  ["csv", "CSV"],
  ["testrail", "TestRail XML"],
  ["qase", "Qase JSON"],
  ["testlink", "TestLink XML"],
] as const;

export default async function ImportPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  const tab = TABS.some(([key]) => key === searchParams.tab) ? searchParams.tab! : "csv";

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="import" />

      <div className="flex gap-1 border-b border-slate-200 text-sm">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/projects/${project.slug}/import${key === "csv" ? "" : `?tab=${key}`}`}
            data-testid={`import-tab-${key}`}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${
              tab === key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === "csv" && (
            <CsvImporter
              projectSlug={project.slug}
              suites={project.suites.map((s) => ({
                id: s.id,
                name: s.name,
                parentId: s.parentId,
              }))}
            />
          )}
          {tab === "testrail" && (
            <ToolImporter
              projectSlug={project.slug}
              tool="testrail"
              label="TestRail"
              accept=".xml"
              contentType="application/xml"
              help={
                <>
                  Upload a TestRail suite XML export (<code className="rounded bg-slate-100 px-1">Suites → Export</code>).
                  Sections become nested suites; priority and case type are mapped automatically.
                </>
              }
            />
          )}
          {tab === "qase" && (
            <ToolImporter
              projectSlug={project.slug}
              tool="qase"
              label="Qase"
              accept=".json"
              contentType="application/json"
              help={
                <>
                  Upload a Qase JSON export with top-level <code className="rounded bg-slate-100 px-1">suites</code> and{" "}
                  <code className="rounded bg-slate-100 px-1">cases</code> arrays.
                </>
              }
            />
          )}
          {tab === "testlink" && (
            <ToolImporter
              projectSlug={project.slug}
              tool="testlink"
              label="TestLink"
              accept=".xml"
              contentType="application/xml"
              help={
                <>
                  Upload a TestLink test-suite XML export. Nested <code className="rounded bg-slate-100 px-1">&lt;testsuite&gt;</code>{" "}
                  elements become nested suites.
                </>
              }
            />
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TFIcon name="checklist" className="h-5 w-5" /> How it works
          </h4>
          <ol className="mt-4 space-y-4">
            {(tab === "csv" ? STEPS : TOOL_STEPS).map((s, i) => (
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
