import type { Metadata } from "next";
import Link from "next/link";
import { ApiDocs } from "@/components/ApiDocs";

export const metadata: Metadata = {
  title: "API Reference — TestForge",
  description: "REST API reference for TestForge (OpenAPI 3.1).",
};

export const dynamic = "force-dynamic";

// F-33: v1 and v2 are both live and both documented. v1 stays the default so
// existing bookmarks keep landing on the API their integrations actually use.
const VERSIONS = [
  { id: "v1", label: "v1", specUrl: "/api/v1/openapi" },
  { id: "v2", label: "v2", specUrl: "/api/v2/openapi" },
] as const;

export default function ApiDocsPage({
  searchParams,
}: {
  searchParams?: { v?: string };
}) {
  const active = VERSIONS.find((v) => v.id === searchParams?.v) ?? VERSIONS[0];

  return (
    <>
      <nav className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Back to app
        </Link>
        <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          API version
        </span>
        {VERSIONS.map((v) => (
          <Link
            key={v.id}
            href={`/docs/api?v=${v.id}`}
            aria-current={v.id === active.id ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm font-medium motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-tf-out ${
              v.id === active.id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {v.label}
          </Link>
        ))}
        <span className="text-xs text-slate-400">
          {active.id === "v1"
            ? "Frozen and supported — not deprecated."
            : "Current. Adds milestones, members, webhooks, pagination and project-scoped keys."}
        </span>
      </nav>
      <ApiDocs specUrl={active.specUrl} />
    </>
  );
}
