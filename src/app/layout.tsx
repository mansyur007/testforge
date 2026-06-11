import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "TestForge — Test Case Management",
  description:
    "Open source test case management platform — the free alternative to TestRail, Qase.io, and Zephyr.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} bg-slate-50 font-sans text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
