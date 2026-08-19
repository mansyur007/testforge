import type { Metadata } from "next";
import { AcademyRoadmapPage } from "@/components/academy/RoadmapPage";
import { TRACKS } from "@/content/academy";
import { idLessonSlugs } from "@/content/academy/i18n";
import { academyChrome } from "@/lib/academy/chrome";
import { bilingual, INDEXABLE } from "@/lib/seo";

// A-09: this route stays outside the (app) group so it's reachable without a
// session (Google's crawler and a signed-out learner both need that) — see
// docs/QA-ACADEMY.md A-09. It reads the session itself, optionally: a signed-in
// visitor gets the same shell as the rest of the app instead of a second,
// disconnected-looking page; a guest gets the public chrome with a way in.
// Reading the session cookie makes this route dynamic per request.
//
// A-08: the page body now lives in `AcademyRoadmapPage`, shared with
// `/id/academy`. This file is the English route and its metadata, nothing more.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const t = academyChrome.en.roadmap;
  // Advertise the Indonesian sibling only once something is translated —
  // `bilingual` explains why a dead `hreflang` is worse than none.
  const translated = TRACKS.some((tr) => idLessonSlugs(tr.slug).size > 0);
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: bilingual("/academy", translated),
    robots: INDEXABLE,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: "/academy",
      title: "TestForge QA Academy",
      description: t.metaDescription,
    },
  };
}

export default async function Page() {
  return <AcademyRoadmapPage lang="en" />;
}
