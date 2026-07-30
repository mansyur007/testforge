import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { Markdown } from "@/components/Markdown";
import { HELP_TOPICS, getHelpTopic } from "@/content/help";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, canonical, ldGraph, techArticleLd } from "@/lib/seo";

export function generateStaticParams() {
  return HELP_TOPICS.map((t) => ({ topic: t.slug }));
}

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

export default function HelpTopicPage({ params }: { params: { topic: string } }) {
  const topic = getHelpTopic(params.topic);
  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
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
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/dashboard" className="text-sm text-accent-text hover:underline">
          Back to app
        </Link>
      </div>

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
    </main>
  );
}
