import { ProjectTabs } from "@/components/ProjectTabs";
import { DefectsSection } from "@/components/tracking/DefectsSection";
import { loadProjectChrome } from "@/lib/project-chrome";

export const dynamic = "force-dynamic";

// Standalone permalink for the "defects" tracking section. The same section
// also renders inside the tracking modal (/projects/<slug>/tracking/defects);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function DefectsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="defects" />
      <DefectsSection
        params={params}
        searchParams={searchParams}
        basePath={`/projects/${project.slug}/defects`}
      />
    </div>
  );
}
