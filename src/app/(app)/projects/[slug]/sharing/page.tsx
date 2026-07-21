import { ProjectTabs } from "@/components/ProjectTabs";
import { SharingSection } from "@/components/settings/SharingSection";
import { loadSettingsProject } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// Standalone permalink for the "sharing" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/sharing);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function SharingPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="sharing" />
      <SharingSection
        params={params}
        searchParams={{}}
        basePath={`/projects/${project.slug}/sharing`}
      />
    </div>
  );
}
