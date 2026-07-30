// F-40: renders a JSON-LD block. Server component — the markup ships in the
// HTML the crawler receives, no hydration involved.
//
// `<` is escaped so a string coming from content (a FAQ answer, a project
// description) can never close the script tag early.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
