import { notFound } from "next/navigation";
import { findTrackingRenderer } from "@/lib/tracking-sections";

export const dynamic = "force-dynamic";

// One route per tracking section. The section component is the same one the
// standalone /projects/<slug>/<section> permalink renders — only the chrome
// around it differs (modal here, project tab bar there).
export default async function TrackingSectionPage({
  params,
  searchParams,
}: {
  params: { slug: string; section: string };
  searchParams: Record<string, string | undefined>;
}) {
  const render = findTrackingRenderer(params.section);
  if (!render) notFound();

  return render({
    params: { slug: params.slug },
    searchParams,
    basePath: `/projects/${params.slug}/tracking/${params.section}`,
  });
}
