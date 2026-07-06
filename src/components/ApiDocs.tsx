"use client";

import Script from "next/script";

// Renders the OpenAPI spec with Redoc loaded from a CDN — keeps the app free of
// a heavy docs dependency. The <redoc> element is auto-hydrated by the bundle
// once it loads (afterInteractive, so the element is already in the DOM).
export function ApiDocs() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: '<redoc spec-url="/api/v1/openapi"></redoc>',
        }}
      />
      <Script
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
        strategy="afterInteractive"
      />
    </>
  );
}
