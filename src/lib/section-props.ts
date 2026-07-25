// Every hub section component takes this same prop shape, whether it's
// rendered standalone (basePath = /projects/<slug>/<key>) or inside its hub
// modal (basePath = /projects/<slug>/<hub>/<key>). A section with its own
// internal sub-navigation (tabs, wizard steps) must build those links off
// `basePath` rather than hardcoding a route — hardcoding it means clicking a
// tab while inside the modal navigates to the standalone page instead of
// switching tabs in place.
//
// Lives on its own, with no imports, so client components can pull the type in
// without dragging a server module (db, next/headers) into the browser bundle.
export type SectionProps = {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
  basePath: string;
};
