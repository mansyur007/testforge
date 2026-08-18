import type { Metadata } from "next";
import { AcademyTrackPage } from "@/components/academy/TrackPage";
import { getTrack } from "@/content/academy";
import { idLessonSlugs } from "@/content/academy/i18n";
import { bilingual, INDEXABLE } from "@/lib/seo";

// A-09b: this page reads the session so a signed-in visitor keeps the app shell
// here — clicking into a track used to drop the sidebar and look like a
// different product. Reading the session cookie forces dynamic rendering, so
// the `generateStaticParams` + `dynamicParams = false` pair that used to
// prerender the published tracks is gone; `getTrack()` returns undefined for a
// draft or unknown slug and the shared component turns that into the same 404,
// on every request rather than only for params missing from a build-time list.
//
// A-08: the body is `AcademyTrackPage`, shared with `/id/academy/[track]`.
export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: { track: string };
}): Metadata {
  const track = getTrack(params.track);
  if (!track) return { title: "QA Academy — TestForge" };
  const title = `${track.title} — TestForge QA Academy`;
  const path = `/academy/${track.slug}`;
  return {
    title,
    description: track.tagline,
    alternates: bilingual(path, idLessonSlugs(track.slug).size > 0),
    robots: INDEXABLE,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: path,
      title,
      description: track.tagline,
    },
  };
}

export default async function Page({ params }: { params: { track: string } }) {
  return <AcademyTrackPage trackSlug={params.track} lang="en" />;
}
