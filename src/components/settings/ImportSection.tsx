import Link from "next/link";
import { notFound } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { CsvImporter } from "@/components/CsvImporter";
import { ToolImporter } from "@/components/ToolImporter";
import type { SectionProps } from "@/lib/section-props";

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
  ["gherkin", "Gherkin (.feature)"],
] as const;

export async function ImportSection({
  params,
  searchParams,
  basePath,
}: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  const tab = TABS.some(([key]) => key === searchParams.tab) ? searchParams.tab! : "csv";

  return (
    <div className="space-y-6">

      {/* Scrolls horizontally on a phone, same treatment as ProjectTabs — five
          importer names don't fit a 375px row. */}
      <div className="flex gap-1 overflow-x-auto border-b border-hairline text-sm">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`${basePath}${key === "csv" ? "" : `?tab=${key}`}`}
            data-testid={`import-tab-${key}`}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2 font-medium ${
              tab === key
                ? "border-accent text-accent-soft-fg"
                : "border-transparent text-content-muted hover:text-content"
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
              customFieldDefs={(
                await db.customFieldDef.findMany({
                  where: { projectId: project.id, entity: "CASE", active: true },
                  orderBy: { order: "asc" },
                })
              ).map((d) => ({ key: d.key, label: d.label }))}
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
                  Upload a TestRail suite XML export (<code className="rounded bg-surface-muted px-1">Suites → Export</code>).
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
                  Upload a Qase JSON export with top-level <code className="rounded bg-surface-muted px-1">suites</code> and{" "}
                  <code className="rounded bg-surface-muted px-1">cases</code> arrays.
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
                  Upload a TestLink test-suite XML export. Nested <code className="rounded bg-surface-muted px-1">&lt;testsuite&gt;</code>{" "}
                  elements become nested suites.
                </>
              }
            />
          )}
          {tab === "gherkin" && (
            <ToolImporter
              projectSlug={project.slug}
              tool="gherkin"
              label="Gherkin"
              accept=".feature"
              contentType="text/plain"
              help={
                <>
                  Upload a <code className="rounded bg-surface-muted px-1">.feature</code> file. Each{" "}
                  <code className="rounded bg-surface-muted px-1">Scenario:</code> becomes one case (the
                  whole Given/When/Then block is kept as-is); tags become the case&apos;s tags, and
                  the Feature name becomes its suite. <code className="rounded bg-surface-muted px-1">Background:</code>{" "}
                  steps are not imported (no per-case home for them yet).
                </>
              }
            />
          )}
        </div>

        <aside className="rounded-xl border border-hairline bg-surface p-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-content">
            <TFIcon name="checklist" className="h-5 w-5" /> How it works
          </h4>
          <ol className="mt-4 space-y-4">
            {(tab === "csv" ? STEPS : TOOL_STEPS).map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-fg">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-content">{s.t}</p>
                  <p className="text-xs leading-relaxed text-content-subtle">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
