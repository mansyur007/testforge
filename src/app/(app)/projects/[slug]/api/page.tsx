import { ProjectTabs } from "@/components/ProjectTabs";
import { ApiSection } from "@/components/settings/ApiSection";
import { loadSettingsProject } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// Standalone permalink for the "api" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/api);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function ApiPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="api" />
      <ApiSection params={params} searchParams={{}} />
    </div>
  );
}
