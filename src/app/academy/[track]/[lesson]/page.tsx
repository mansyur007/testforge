import type { Metadata } from "next";
import { AcademyLessonPage } from "@/components/academy/LessonPage";
import { getLesson } from "@/content/academy";
import { hasIdLesson } from "@/content/academy/i18n";
import { bilingual, INDEXABLE } from "@/lib/seo";

// A-09b: same change as the track page — a signed-in reader keeps the app shell
// on a lesson instead of being dropped into standalone reading chrome. Lessons
// are the Academy's SEO surface and are still fully server-rendered per
// request; what they lose is the prerender and the CDN cache (docs/QA-ACADEMY.md
// §8, A-01, A-09).
//
// A-08: the body is `AcademyLessonPage`, shared with the Indonesian route.
export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: { track: string; lesson: string };
}): Metadata {
  const found = getLesson(params.track, params.lesson);
  if (!found) return { title: "QA Academy — TestForge" };
  const { track, lesson } = found;
  const title = `${lesson.title} — ${track.title} | TestForge QA Academy`;
  const path = `/academy/${track.slug}/${lesson.slug}`;
  // Each lesson carries its own summary as the description; without it Google
  // writes the snippet from whatever text it finds first, which on these pages
  // is the lesson rail (the same trap F-40 fixed on the help center).
  return {
    title,
    description: lesson.summary,
    alternates: bilingual(path, hasIdLesson(track.slug, lesson.slug)),
    robots: INDEXABLE,
    openGraph: {
      type: "article",
      siteName: "TestForge",
      url: path,
      title,
      description: lesson.summary,
    },
  };
}

export default async function Page({
  params,
}: {
  params: { track: string; lesson: string };
}) {
  return (
    <AcademyLessonPage
      trackSlug={params.track}
      lessonSlug={params.lesson}
      lang="en"
    />
  );
}
