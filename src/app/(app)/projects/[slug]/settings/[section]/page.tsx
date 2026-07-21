import { notFound } from "next/navigation";
import { findSectionRenderer } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// One route per settings section. The section component is the same one the
// standalone /projects/<slug>/<section> permalink renders — only the chrome
// around it differs (modal here, project tab bar there).
export default async function SettingsSectionPage({
  params,
  searchParams,
}: {
  params: { slug: string; section: string };
  searchParams: Record<string, string | undefined>;
}) {
  const render = findSectionRenderer(params.section);
  if (!render) notFound();

  return render({
    params: { slug: params.slug },
    searchParams,
    basePath: `/projects/${params.slug}/settings/${params.section}`,
  });
}
