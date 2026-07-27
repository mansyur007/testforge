import Link from "next/link";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { HELP_TOPICS } from "@/content/help";

export const metadata: Metadata = {
  title: "Help — TestForge",
  description: "Guides for using TestForge: test cases, runs, plans, automation, and more.",
};

export default function HelpIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/dashboard" className="text-sm text-accent-text hover:underline">
          Back to app
        </Link>
      </div>
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <TFIcon name="nav-help" className="h-9 w-9" />
        Help
      </h1>
      <p className="mt-3 text-content">
        Guides for using TestForge day to day. Looking for the REST API instead? See the{" "}
        <Link href="/docs/api" className="text-accent-text hover:underline">
          API reference
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {HELP_TOPICS.map((t) => (
          <Link
            key={t.slug}
            href={`/docs/help/${t.slug}`}
            data-testid={`help-topic-${t.slug}`}
            className="rounded-xl border border-hairline bg-surface p-4 hover:border-accent-ring hover:shadow-sm"
          >
            <h2 className="font-semibold text-content-strong">{t.title}</h2>
            <p className="mt-1 text-sm text-content-muted">{t.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
