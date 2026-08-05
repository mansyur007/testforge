import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberScope } from "@/lib/projects";

// Tab title for the whole /projects/[slug]/* section — without this every
// page under a project inherits the root layout's generic
// "TestForge — Test Case Management", so a user with several projects open
// in different tabs can't tell them apart. `robots` still comes from the
// (app) layout above (NOINDEX) since we don't override it here.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { name: true },
  });
  // Unknown/inaccessible slug: leave the title alone, the page itself calls
  // notFound() and renders the default title.
  if (!project) return {};
  return { title: `${project.name} — TestForge` };
}

export default function ProjectSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
