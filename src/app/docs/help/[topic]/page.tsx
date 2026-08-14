import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AuthedAppShell } from "@/components/AuthedAppShell";
import { Logo, TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { HELP_TOPICS, getHelpTopic } from "@/content/help";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, canonical, ldGraph, techArticleLd } from "@/lib/seo";

// A-09b: the help index already branched on the session (A-09); its topic pages
// did not, so opening one from inside the app dropped the sidebar. Reading the
// session cookie forces dynamic rendering, which rules out prerendering the
// topics — `getHelpTopic()` still returns undefined for an unknown slug and
// `notFound()` below still turns that into a 404.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  const topic = getHelpTopic(params.topic);
  if (!topic) return { title: "Help — TestForge", robots: { index: false } };
  const title = `${topic.title} — TestForge Help`;
  const path = `/docs/help/${topic.slug}`;
  // F-40: every topic carries its own summary as the description — without it
  // Google writes the snippet from whatever text it finds first, which for
  // these pages is the sidebar nav.
  return {
    title,
    description: topic.summary,
    alternates: canonical(path),
    openGraph: {
      type: "article",
      siteName: "TestForge",
      url: path,
      title,
      description: topic.summary,
    },
  };
}

export default async function HelpTopicPage({
  params,
}: {
  params: { topic: string };
}) {
  const topic = getHelpTopic(params.topic);
  if (!topic) notFound();

  const session = await getSession();

  const jsonLd = (
    <>
      <JsonLd
        data={ldGraph(
          techArticleLd({
            headline: topic.title,
            description: topic.summary,
            path: `/docs/help/${topic.slug}`,
          }),
          breadcrumbLd([
            { name: "TestForge", path: "/" },
            { name: "Help", path: "/docs/help" },
            { name: topic.title, path: `/docs/help/${topic.slug}` },
          ]),
        )}
      />
    </>
  );

  const body = (
    <>
      <div className="flex gap-10">
        <nav className="hidden w-52 shrink-0 space-y-1 md:block">
          <Link
            href="/docs/help"
            className="mb-2 flex items-center gap-1.5 text-sm text-content-muted hover:text-accent-text"
          >
            <TFIcon name="nav-help" className="h-4 w-4" /> All topics
          </Link>
          {HELP_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/docs/help/${t.slug}`}
              className={`block rounded-lg px-3 py-1.5 text-sm ${
                t.slug === topic.slug
                  ? "bg-accent-soft font-medium text-accent-soft-fg"
                  : "text-content hover:bg-surface-muted"
              }`}
            >
              {t.title}
            </Link>
          ))}
        </nav>

        <article className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <p className="mt-2 text-content-muted">{topic.summary}</p>
          <Markdown className="mt-8 max-w-none text-base leading-relaxed">{topic.body}</Markdown>
        </article>
      </div>
    </>
  );

  if (session) {
    return (
      <AuthedAppShell session={session}>
        {jsonLd}
        <div className="mx-auto max-w-5xl">{body}</div>
      </AuthedAppShell>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {jsonLd}

      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-accent-text hover:underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
          >
            Sign up
          </Link>
        </div>
      </div>

      {body}
    </main>
  );
}
