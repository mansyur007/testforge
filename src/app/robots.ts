import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

// HP-008: robots.txt — area aplikasi privat tidak di-crawl
// F-40: the disallow list now covers every non-public route group, not just the
// four originals. Each of these routes also carries `robots: NOINDEX` in its own
// metadata — robots.txt only asks a crawler not to fetch a URL; the meta tag is
// what keeps it out of the index when someone links to it from elsewhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/projects",
        "/my-work",
        "/settings",
        "/onboarding",
        "/print/",
        "/share/", // F-17 unguessable-token links
        "/invite/",
        "/verify",
        "/verify-email",
        "/reset-password",
        "/forgot-password",
        "/login/2fa",
        "/offline",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
