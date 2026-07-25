import { ProjectTabs } from "@/components/ProjectTabs";
import { FieldsSection } from "@/components/settings/FieldsSection";
import { loadProjectChrome } from "@/lib/project-chrome";

export const dynamic = "force-dynamic";

// Standalone permalink for the "fields" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/fields);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function FieldsPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="fields" />
      <FieldsSection
        params={params}
        searchParams={{}}
        basePath={`/projects/${project.slug}/fields`}
      />
    </div>
  );
}
