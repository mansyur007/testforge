import type { Metadata } from "next";
import { AcademyLessonPage } from "@/components/academy/LessonPage";
import { getTrack } from "@/content/academy";
import { hasIdLesson, localiseTrack } from "@/content/academy/i18n";
import { bilingualId, INDEXABLE, NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: { track: string; lesson: string };
}): Metadata {
  const source = getTrack(params.track);
  if (!source || !hasIdLesson(params.track, params.lesson)) {
    return { title: "QA Academy — TestForge", robots: NOINDEX };
  }
  const track = localiseTrack(source, "id");
  const lesson = track.lessons.find((l) => l.slug === params.lesson);
  if (!lesson) return { title: "QA Academy — TestForge", robots: NOINDEX };
  const title = `${lesson.title} — ${track.title} | TestForge QA Academy`;
  const path = `/academy/${track.slug}/${lesson.slug}`;
  return {
    title,
    description: lesson.summary,
    alternates: bilingualId(path),
    robots: INDEXABLE,
    openGraph: {
      type: "article",
      siteName: "TestForge",
      url: `/id${path}`,
      title,
      description: lesson.summary,
      locale: "id_ID",
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
      lang="id"
    />
  );
}
