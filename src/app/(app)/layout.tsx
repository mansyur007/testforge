import { requireSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { NOINDEX } from "@/lib/seo";

// F-40: one noindex for the whole authenticated shell. Pages inside this group
// may set their own title; `robots` merges down from here unless one overrides
// it, so no in-app route can be indexed by forgetting a tag.
export const metadata = { robots: NOINDEX };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // A-09: the sidebar/AppShell wiring itself now lives in AuthedAppShell so
  // /academy and /docs/help can render the identical shell for a signed-in
  // visitor instead of duplicating it — see docs/QA-ACADEMY.md A-09.
  return <AuthedAppShell session={session}>{children}</AuthedAppShell>;
}
