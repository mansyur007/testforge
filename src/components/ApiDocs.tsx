"use client";

import Script from "next/script";

// Renders the OpenAPI spec with Redoc loaded from a CDN — keeps the app free of
// a heavy docs dependency. The <redoc> element is auto-hydrated by the bundle
// once it loads (afterInteractive, so the element is already in the DOM).
//
// F-33: two specs are published side by side. `specUrl` picks one; the element
// is keyed on it so switching versions remounts Redoc instead of leaving the
// previously-rendered spec in place. `tf-api-docs-fade` softens that remount
// (and the first-load gap before the CDN bundle hydrates <redoc>) — see
// globals.css; it only touches our wrapper, never Redoc's own internals.
export function ApiDocs({ specUrl = "/api/v1/openapi" }: { specUrl?: string }) {
  return (
    <>
      <div
        key={specUrl}
        className="tf-api-docs-fade"
        dangerouslySetInnerHTML={{
          __html: `<redoc spec-url="${specUrl}"></redoc>`,
        }}
      />
      <Script
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
        strategy="afterInteractive"
      />
    </>
  );
}
