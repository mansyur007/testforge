import type { MetadataRoute } from "next";
import { HELP_TOPICS } from "@/content/help";
import { publishedLessons, publishedTracks } from "@/content/academy";
import { visibleLessons } from "@/content/academy/i18n";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

// HP-008: sitemap.xml
// F-40: adds the help center (nine topics that were invisible to crawlers), the
// API reference, and every project its owner published AND marked indexable.
export const dynamic = "force-dynamic";

/**
 * Public projects opted into indexing (F-38). `indexable: false` shares stay
 * out — they already render `robots: noindex`, and listing them here would
 * advertise URLs their owners asked not to surface.
 */
async function publicProjectEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const shares = await db.publicShare.findMany({
      where: { enabled: true, indexable: true },
      select: {
        updatedAt: true,
        showCases: true,
        project: { select: { slug: true } },
      },
    });
    return shares.flatMap((share) => {
      const base = `/public/${share.project.slug}`;
      // `Project` has no updatedAt column, so the share row's own timestamp is
      // the best signal available for <lastmod>.
      const lastModified = share.updatedAt;
      const entries: MetadataRoute.Sitemap = [
        {
          url: absoluteUrl(base),
          lastModified,
          changeFrequency: "weekly",
          priority: 0.6,
        },
      ];
      if (share.showCases) {
        entries.push({
          url: absoluteUrl(`${base}/cases`),
          lastModified,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
      return entries;
    });
  } catch {
    // No DB reachable (e.g. `next build` in CI): still serve the static half
    // rather than failing the whole route.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/signup"), changeFrequency: "monthly", priority: 0.9 },
    {
      url: absoluteUrl("/docs/self-hosting"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: absoluteUrl("/docs/help"), changeFrequency: "monthly", priority: 0.8 },
    ...HELP_TOPICS.map((topic) => ({
      url: absoluteUrl(`/docs/help/${topic.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: absoluteUrl("/docs/api"), changeFrequency: "monthly", priority: 0.7 },
    // A-03: QA Academy. Only published tracks and lessons are listed — drafts
    // have no route at all (`dynamicParams = false`), so advertising them here
    // would put 404s in the sitemap.
    { url: absoluteUrl("/academy"), changeFrequency: "weekly", priority: 0.9 },
    ...publishedTracks().flatMap((track) => [
      {
        url: absoluteUrl(`/academy/${track.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...publishedLessons(track).map((lesson) => ({
        url: absoluteUrl(`/academy/${track.slug}/${lesson.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ]),
    // A-08: the Indonesian routes, listed from the same source the routes
    // themselves gate on (`visibleLessons`), so the sitemap cannot advertise a
    // URL that 404s — which was the failure mode worth designing against here,
    // since A-08 translates one track at a time and every intermediate state
    // has more English lessons than Indonesian ones. A track appears only once
    // at least one of its lessons does; `/id/academy` itself appears only once
    // some track does.
    ...(publishedTracks().some((track) => visibleLessons(track, "id").length > 0)
      ? [
          {
            url: absoluteUrl("/id/academy"),
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
        ]
      : []),
    ...publishedTracks().flatMap((track) => {
      const lessons = visibleLessons(track, "id");
      if (lessons.length === 0) return [];
      return [
        {
          url: absoluteUrl(`/id/academy/${track.slug}`),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        ...lessons.map((lesson) => ({
          url: absoluteUrl(`/id/academy/${track.slug}/${lesson.slug}`),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        })),
      ];
    }),
    { url: absoluteUrl("/login"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
  ];
  return [...staticEntries, ...(await publicProjectEntries())];
}
