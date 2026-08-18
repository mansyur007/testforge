import type { Metadata } from "next";
import { AcademyTrackPage } from "@/components/academy/TrackPage";
import { getTrack } from "@/content/academy";
import { idLessonSlugs, localiseTrack } from "@/content/academy/i18n";
import { bilingualId, INDEXABLE, NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: { track: string };
}): Metadata {
  const source = getTrack(params.track);
  // A track with no Indonesian lessons has no Indonesian page — the component
  // 404s it. Returning NOINDEX here as well means that even if a crawler is
  // holding a stale URL from an earlier sitemap, the response it gets says so.
  if (!source || idLessonSlugs(source.slug).size === 0) {
    return { title: "QA Academy — TestForge", robots: NOINDEX };
  }
  const track = localiseTrack(source, "id");
  const title = `${track.title} — TestForge QA Academy`;
  const path = `/academy/${track.slug}`;
  return {
    title,
    description: track.tagline,
    alternates: bilingualId(path),
    robots: INDEXABLE,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: `/id${path}`,
      title,
      description: track.tagline,
      locale: "id_ID",
    },
  };
}

export default async function Page({ params }: { params: { track: string } }) {
  return <AcademyTrackPage trackSlug={params.track} lang="id" />;
}
