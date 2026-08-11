import Link from "next/link";
import type { Metadata } from "next";
import { Logo, TFIcon } from "@/components/icons";
import { BetaChip } from "@/components/BetaChip";
import { Markdown } from "@/components/Markdown";
import { SandboxReset } from "@/components/SandboxControls";
import { openSandbox } from "@/app/actions/academy";
import { requireSession } from "@/lib/auth";
import { findSandbox } from "@/lib/academy/sandbox";
import { SANDBOX_SUITES, SHOPMINI_REQUIREMENTS } from "@/content/academy/sandbox";
import { NOINDEX } from "@/lib/seo";

// A-04: the sandbox's home. The rest of Academy is public and prerendered; this
// one page needs a session, because a sandbox belongs to somebody. Keeping it
// here rather than adding session-dependent controls to /academy is what lets
// the roadmap and every lesson stay static.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Academy sandbox — TestForge",
  robots: NOINDEX,
};

export default async function AcademySandboxPage() {
  const session = await requireSession();
  const sandbox = await findSandbox(session.userId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/academy" className="text-sm text-accent-text hover:underline">
          Back to Academy
        </Link>
      </div>

      <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold text-content-strong">
        Your sandbox
        <BetaChip className="translate-y-1" />
      </h1>
      <p className="mt-3 text-content">
        A real TestForge project, seeded with a small shop called{" "}
        <strong>ShopMini</strong>. The hands-on exercises happen here — you write
        real test cases with the real forms, against the requirements below.
      </p>
      <p className="mt-2 text-sm text-content-muted">
        It is kept out of your dashboard, your projects list and search, so
        practice never mixes with your work.
      </p>

      <div className="mt-8 rounded-xl border border-hairline bg-surface p-5">
        {sandbox ? (
          <>
            <h2 className="font-semibold text-content-strong">
              {sandbox.name}
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              {SANDBOX_SUITES.length} suites · 3 reference cases to write against
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/projects/${sandbox.slug}`}
                data-testid="sandbox-open"
                className="min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Open the sandbox
              </Link>
              <SandboxReset />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-content-strong">
              You don&rsquo;t have one yet
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              It takes a second to create and you can wipe it whenever you like.
            </p>
            <form action={openSandbox} className="mt-4">
              <button
                type="submit"
                data-testid="sandbox-create"
                className="min-h-[44px] rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Create my sandbox
              </button>
            </form>
          </>
        )}
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-content-strong">
          <TFIcon name="tpl-blank" className="h-5 w-5" />
          The ShopMini requirements
        </h2>
        <Markdown className="mt-3 max-w-none text-sm leading-relaxed">
          {SHOPMINI_REQUIREMENTS}
        </Markdown>
      </section>
    </main>
  );
}
