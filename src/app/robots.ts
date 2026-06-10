import type { MetadataRoute } from "next";

// HP-008: robots.txt — area aplikasi privat tidak di-crawl
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/projects", "/settings", "/onboarding", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
