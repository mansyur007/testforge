import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { INDEXABLE, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Tipografi sesuai "testforge design system":
// Space Grotesk (display/heading), IBM Plex Sans (body), IBM Plex Mono (label/kode)
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const DESCRIPTION =
  "Open source test case management platform — the free alternative to TestRail, Qase.io, and Zephyr.";

export const metadata: Metadata = {
  // Tanpa metadataBase, Next menulis og:image/twitter:image sebagai
  // http://localhost:3000/... — scraper LinkedIn/WhatsApp/Slack tidak bisa
  // mengambilnya. NEXT_PUBLIC_BASE_URL di-bake saat build Docker
  // (docker-compose.prod.yml → build.args).
  metadataBase: new URL(SITE_URL),
  title: "TestForge — Test Case Management",
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // F-40: site-wide defaults every page inherits unless it overrides them.
  // Keywords carry no ranking weight at Google, but Bing and several
  // LLM crawlers still read them, and they cost one tag.
  keywords: [
    "test case management",
    "test management tool",
    "open source TestRail alternative",
    "Qase alternative",
    "Zephyr alternative",
    "QA test management",
    "self-hosted test management",
    "JUnit XML reporting",
    "test automation dashboard",
  ],
  authors: [{ name: "TestForge" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  robots: INDEXABLE,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: "TestForge — Test Case Management",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "TestForge — Test Case Management",
    description: DESCRIPTION,
  },
  // Phone-number autolinking mangles IDs like TC-WEB-001 on iOS Safari.
  formatDetection: { telephone: false, date: false, address: false },
};

// F-36: enable installable/standalone rendering. viewport-fit: cover lets the
// mobile executor pad its fixed bottom bar with env(safe-area-inset-bottom) so
// the thumb-zone status buttons clear the home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* F-39: applies the theme class before first paint. suppressHydrationWarning
            on <html> is required — the server renders no class, this script adds one. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} bg-canvas font-sans text-content-strong antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
