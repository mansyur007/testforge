import { ProjectTabs } from "@/components/ProjectTabs";
import { RequirementsSection } from "@/components/tracking/RequirementsSection";
import { loadProjectChrome } from "@/lib/project-chrome";

export const dynamic = "force-dynamic";

// Standalone permalink for the "requirements" tracking section. The same
// section also renders inside the tracking modal
// (/projects/<slug>/tracking/requirements); this route keeps the project tab
// bar around it so a direct link still lands somewhere navigable.
export default async function RequirementsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={project.slug}
        name={project.name}
        active="requirements"
      />
      <RequirementsSection
        params={params}
        searchParams={searchParams}
        basePath={`/projects/${project.slug}/requirements`}
      />
    </div>
  );
}
