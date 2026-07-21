import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { loadPerms } from "@/lib/permissions";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { TFIcon } from "@/components/icons";
import { publicShareUrl } from "@/lib/public-share";
import {
  enablePublicShare,
  disablePublicShare,
  updatePublicShare,
} from "@/app/actions/public-share";
import type { SectionProps } from "@/lib/settings-nav";

// F-38: owner-facing controls for public "portfolio mode" sharing.
export async function SharingSection({
  params,
}: SectionProps) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  // Same permission the other project-settings surfaces use (badge, webhooks).
  const perms = await loadPerms(session.userId, project.id);
  const canManage = perms.has("project.admin");

  const share = await db.publicShare.findUnique({
    where: { projectId: project.id },
  });
  const active = share?.enabled === true;
  const publicPath = `/public/${project.slug}`;

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-semibold">Public sharing</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Publish a read-only view of this project — a portfolio page anyone can
          open without signing in. Visitors can never edit anything, and only
          the sections you enable below are visible.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-semibold">
              <TFIcon name="tpl-web" className="h-5 w-5" />
              {active ? "This project is public" : "This project is private"}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              The public URL is your project slug, so it is{" "}
              <strong className="font-medium text-slate-700">guessable</strong>:
              anyone who knows or guesses{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">
                {publicPath}
              </code>{" "}
              can read every section you turn on. Turn sharing off to make all
              of those URLs 404 again.
            </p>
          </div>
          {canManage && (
            <form action={active ? disablePublicShare : enablePublicShare}>
              <input type="hidden" name="projectId" value={project.id} />
              <button
                data-testid={
                  active ? "public-share-disable" : "public-share-enable"
                }
                className={
                  active
                    ? "rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    : "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                }
              >
                {active ? "Stop sharing" : "Make this project public"}
              </button>
            </form>
          )}
        </div>

        {active && (
          <div className="mt-6 space-y-6 border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Public URL
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code
                  className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-600"
                  data-testid="public-share-url"
                >
                  {publicShareUrl(project.slug)}
                </code>
                <CopyLinkButton path={publicPath} />
                <Link
                  href={publicPath}
                  target="_blank"
                  rel="noopener"
                  data-testid="public-share-preview"
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100"
                >
                  View public page
                </Link>
              </div>
            </div>

            <form action={updatePublicShare} className="space-y-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Sections
                </p>
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="showCases"
                    defaultChecked={share?.showCases ?? true}
                    disabled={!canManage}
                    data-testid="public-share-cases-toggle"
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Test Cases</span>
                    <span className="block text-xs text-slate-400">
                      Suite folders, the case list and each case&apos;s steps.
                      The project overview is always visible while sharing is
                      on.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Search engines
                </p>
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="indexable"
                    defaultChecked={share?.indexable ?? false}
                    disabled={!canManage}
                    data-testid="public-share-indexable-toggle"
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">
                      Allow search engines to index this page
                    </span>
                    <span className="block text-xs text-slate-400">
                      Off by default — the public pages send{" "}
                      <code className="rounded bg-slate-100 px-1">noindex</code>{" "}
                      until you turn this on.
                    </span>
                  </span>
                </label>
              </div>

              {canManage && (
                <button
                  data-testid="public-share-save"
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Save settings
                </button>
              )}
            </form>
          </div>
        )}

        {!canManage && (
          <p className="mt-4 text-xs text-slate-400">
            Only project admins can change public sharing.
          </p>
        )}
      </section>
    </div>
  );
}
