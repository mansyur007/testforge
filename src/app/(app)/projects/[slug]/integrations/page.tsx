import { ProjectTabs } from "@/components/ProjectTabs";
import { IntegrationsSection } from "@/components/settings/IntegrationsSection";
import { loadSettingsProject } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// Standalone permalink for the "integrations" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/integrations);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function IntegrationsPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="integrations" />
      <IntegrationsSection params={params} searchParams={{}} />
    </div>
  );
}
