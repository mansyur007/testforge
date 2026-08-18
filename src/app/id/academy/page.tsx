import type { Metadata } from "next";
import { AcademyRoadmapPage } from "@/components/academy/RoadmapPage";
import { academyChrome } from "@/lib/academy/chrome";
import { bilingualId, INDEXABLE } from "@/lib/seo";

// A-08: the Indonesian roadmap. Same component as `/academy`, `lang="id"`.
//
// This route exists at all because the language cookie A-03 shipped is
// invisible to a crawler: one URL serving two languages can only ever be
// indexed as one of them, and it was always going to be the English one. See
// docs/QA-ACADEMY.md § A-08.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const t = academyChrome.id.roadmap;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: bilingualId("/academy"),
    robots: INDEXABLE,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: "/id/academy",
      title: "TestForge QA Academy",
      description: t.metaDescription,
      locale: "id_ID",
    },
  };
}

export default async function Page() {
  return <AcademyRoadmapPage lang="id" />;
}
