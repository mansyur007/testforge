import { ProjectTabs } from "@/components/ProjectTabs";
import { ImportSection } from "@/components/settings/ImportSection";
import { loadProjectChrome } from "@/lib/project-chrome";

export const dynamic = "force-dynamic";

// Standalone permalink for the "import" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/import);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function ImportPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="import" />
      <ImportSection
        params={params}
        searchParams={searchParams}
        basePath={`/projects/${project.slug}/import`}
      />
    </div>
  );
}
