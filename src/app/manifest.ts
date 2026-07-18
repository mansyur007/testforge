import type { MetadataRoute } from "next";

// F-36 Part A: web app manifest as a Next Metadata route — bundles into `.next`
// (served at /manifest.webmanifest), so no static file to forget in the Docker
// image. theme_color matches the slate-900 sidebar so the mobile status bar
// melts into the shell; background_color is the slate-50 app background shown
// on the splash before first paint.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TestForge",
    short_name: "TestForge",
    description: "Test case management — manual & automation in one platform.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
