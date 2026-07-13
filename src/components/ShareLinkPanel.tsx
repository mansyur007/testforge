import { db } from "@/lib/db";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { createShareLink, revokeShareLink } from "@/app/actions/share-links";

// F-17: management UI for public share links (create / copy / revoke).
// Rendered on the run & dashboard detail pages for run.manage members only —
// the caller gates on permission.
export async function ShareLinkPanel({
  entityType,
  entityId,
}: {
  entityType: "RUN" | "DASHBOARD";
  entityId: string;
}) {
  const links = await db.shareLink.findMany({
    where: { entityType, entityId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 font-semibold">Public share links</h3>
      <p className="mb-3 text-xs text-slate-400">
        Anyone with a link sees a read-only report — no sign-in, no edits.
      </p>
      <ul className="mb-4 space-y-2 text-sm">
        {links.map((l) => {
          const expired = l.expiresAt != null && l.expiresAt < new Date();
          return (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-2"
              data-testid={`share-link-row-${l.id}`}
              data-token={l.token}
            >
              <code className="max-w-56 truncate rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                /share/{l.token.slice(0, 10)}…
              </code>
              <span className="text-xs text-slate-400">
                {expired
                  ? "expired"
                  : l.expiresAt
                    ? `expires ${l.expiresAt.toLocaleDateString("en-US")}`
                    : "no expiry"}
              </span>
              {!expired && <CopyLinkButton path={`/share/${l.token}`} />}
              <form action={revokeShareLink} className="inline">
                <input type="hidden" name="shareLinkId" value={l.id} />
                <button
                  className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  data-testid={`share-revoke-${l.id}`}
                >
                  Revoke
                </button>
              </form>
            </li>
          );
        })}
        {links.length === 0 && (
          <li className="text-xs text-slate-400">No active links.</li>
        )}
      </ul>
      <form action={createShareLink} className="flex items-center gap-2">
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <select
          name="expires"
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          data-testid="share-expiry-select"
        >
          <option value="never">No expiry</option>
          <option value="7">Expires in 7 days</option>
          <option value="30">Expires in 30 days</option>
        </select>
        <button
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          data-testid="share-create-button"
        >
          + Share link
        </button>
      </form>
    </section>
  );
}
