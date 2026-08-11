import type { Metadata } from "next";

// F-40: one place for everything a crawler reads. HP-008 shipped the basics
// (title/description/OG/sitemap/robots); this module adds the layer above it —
// canonical URLs, a single noindex constant, and the JSON-LD graph — so no page
// hand-rolls its own absolute URL or forgets `alternates`.

/** Absolute origin. Baked at build time in Docker (NEXT_PUBLIC_BASE_URL). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const SITE_NAME = "TestForge";

/** Absolute URL for a site-relative path (`/docs/help` → `https://…/docs/help`). */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Canonical for a page. Relative is enough — Next resolves it against
 * `metadataBase` (set in the root layout) — but keeping it in a helper means
 * the shape stays uniform and grep-able.
 */
export function canonical(path: string): Metadata["alternates"] {
  return { canonical: path };
}

/**
 * Everything behind a login, plus one-shot token pages. `nocache` also keeps
 * these out of search caches if a URL ever leaks into a crawler's queue.
 */
export const NOINDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

/**
 * Public marketing/doc pages. `max-image-preview: large` is what lets Google
 * show the OG image at full width; the default (`standard`) shows a thumbnail.
 */
export const INDEXABLE: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

// ---------------------------------------------------------------------------
// JSON-LD. Plain objects — rendered by <JsonLd> (src/components/JsonLd.tsx).
// Types follow schema.org; Google's rich-result parsers only read the fields
// below, so nothing here is speculative.
// ---------------------------------------------------------------------------

type Ld = Record<string, unknown>;

const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mansyur007/testforge";

export function organizationLd(): Ld {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    sameAs: [`https://github.com/${GITHUB_REPO}`],
  };
}

export function websiteLd(): Ld {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
  };
}

/**
 * The product itself. `offers.price: "0"` is the claim that earns the "Free"
 * annotation in results — it is literally true (MIT, no paid tier), so it is
 * safe to state.
 */
export function softwareApplicationLd(opts: {
  description: string;
  ratingCount?: number;
}): Ld {
  return {
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#software"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Test Management",
    operatingSystem: "Web, Docker, Linux",
    description: opts.description,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    softwareHelp: absoluteUrl("/docs/help"),
    installUrl: absoluteUrl("/docs/self-hosting"),
    publisher: { "@id": absoluteUrl("/#organization") },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Manual test case management",
      "Test suites and sections",
      "Test run execution with keyboard shortcuts",
      "JUnit XML import from any automation framework",
      "REST API and CI/CD integration",
      "Reporting, flaky test detection, and automation coverage",
    ],
  };
}

export function faqLd(items: readonly { q: string; a: string }[]): Ld {
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq"),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** `[{ name, path }]` in trail order, root first. */
export function breadcrumbLd(
  trail: readonly { name: string; path: string }[]
): Ld {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function techArticleLd(opts: {
  headline: string;
  description: string;
  path: string;
}): Ld {
  return {
    "@type": "TechArticle",
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.path),
    inLanguage: "en",
    isPartOf: { "@id": absoluteUrl("/#website") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

/**
 * A-03: one Academy track. `hasCourseInstance` is only emitted when a workload
 * is known — Google reads `courseWorkload` for the course rich result, and the
 * lesson minutes in `src/content/academy` are a real figure, not an estimate we
 * invented for the markup. `isAccessibleForFree` is the differentiator worth
 * declaring: every competitor's equivalent is behind a paywall.
 */
export function courseLd(opts: {
  name: string;
  description: string;
  path: string;
  /** Sum of the track's published lesson minutes. */
  workloadMinutes?: number;
}): Ld {
  const hours = opts.workloadMinutes ? Math.floor(opts.workloadMinutes / 60) : 0;
  const minutes = opts.workloadMinutes ? opts.workloadMinutes % 60 : 0;
  return {
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    inLanguage: "en",
    isAccessibleForFree: true,
    provider: { "@id": absoluteUrl("/#organization") },
    isPartOf: { "@id": absoluteUrl("/#website") },
    ...(opts.workloadMinutes
      ? {
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}`,
          },
        }
      : {}),
  };
}

/**
 * Wraps nodes in one `@graph` so a page emits a single <script> the crawler
 * can resolve `@id` references across, instead of N disconnected blobs.
 */
export function ldGraph(...nodes: Ld[]): Ld {
  return { "@context": "https://schema.org", "@graph": nodes };
}
