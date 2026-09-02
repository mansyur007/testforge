import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX } from "@/lib/seo";
import { Logo } from "@/components/icons";
import { requireSuperadmin } from "@/lib/superadmin";
import { TemplateJsonEditor } from "@/components/TemplateJsonEditor";
import { LIMITS } from "@/lib/templates/schema";

export const metadata: Metadata = {
  title: "New Case Template — TestForge Instance Console",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  await requireSuperadmin();

  return (
    <main className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-content-strong">
              New case template
            </h1>
            <p className="text-sm text-content-muted">
              Paste the suite/case tree. It is validated before anything is
              stored, and created as a draft.
            </p>
          </div>
        </header>

        <Link
          href="/superadmin/templates"
          className="inline-block text-sm text-content-muted hover:text-content"
        >
          ← All templates
        </Link>

        <p className="rounded-lg border border-hairline bg-surface px-4 py-3 text-xs text-content-muted">
          Limits: {LIMITS.suites} suites, {LIMITS.cases} cases,{" "}
          {LIMITS.stepsPerCase} steps per case, {LIMITS.depth} levels of
          nesting. Every case needs a <code>coverage</code> —{" "}
          <code>positive</code>, <code>negative</code>, <code>boundary</code>,{" "}
          <code>security</code>, <code>permission</code>, <code>usability</code>{" "}
          or <code>compatibility</code> — and it becomes a real{" "}
          <code>coverage:*</code> tag on every case created from this template.
        </p>

        <TemplateJsonEditor mode="create" />
      </div>
    </main>
  );
}
