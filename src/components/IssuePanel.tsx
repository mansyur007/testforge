"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createIssueFromResult,
  linkIssue,
  unlinkIssue,
  previewIssueFromResult,
} from "@/app/actions/issues";
import { TFIcon } from "@/components/icons";

// F-07: issue links on a case or a run result — badges, "Create issue" (from a
// failed result, with an editable preview of what gets filed), and "Link issue".

export type IssueLinkView = {
  id: string;
  provider: string;
  issueKey: string;
  issueUrl: string;
  title: string | null;
  status: string | null;
};

function displayKey(provider: string, key: string) {
  return provider === "JIRA" ? key : `#${key.replace(/^#/, "")}`;
}

/** Mirrors isIssueClosed() in lib/issue-providers (that module is server-only). */
function isClosed(status: string | null) {
  return !!status && ["done", "closed", "resolved"].includes(status.trim().toLowerCase());
}

export function IssueBadges({
  links,
  canWrite,
}: {
  links: IssueLinkView[];
  canWrite: boolean;
}) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="issue-badges">
      {links.map((l) => (
        <span key={l.id} className="inline-flex items-center gap-1">
          <a
            href={l.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={l.title ?? undefined}
            data-testid={`issue-badge-${l.issueKey}`}
            className={`rounded-full px-2 py-0.5 text-xs font-medium hover:underline ${
              isClosed(l.status)
                ? "bg-success-soft text-success-soft-fg"
                : "bg-warning-soft text-warning-soft-fg"
            }`}
          >
            🐞 {displayKey(l.provider, l.issueKey)}
            {l.status ? ` · ${l.status}` : ""}
          </a>
          {canWrite && (
            <form action={unlinkIssue}>
              <input type="hidden" name="linkId" value={l.id} />
              <button
                type="submit"
                title="Unlink"
                className="text-xs text-content-subtle hover:text-danger"
              >
                ✕
              </button>
            </form>
          )}
        </span>
      ))}
    </div>
  );
}

function LinkSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="issue-link-submit"
      className="rounded-lg border border-hairline-strong px-3 py-1.5 text-xs hover:bg-canvas disabled:opacity-50"
    >
      {pending ? "Linking…" : "Link"}
    </button>
  );
}

function LinkIssueForm({
  entityType,
  entityId,
}: {
  entityType: "CASE" | "RESULT";
  entityId: string;
}) {
  const [state, formAction] = useFormState(linkIssue, undefined);
  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <div className="flex gap-2">
        <input
          name="issueKey"
          required
          placeholder="QA-123, #42, or issue URL"
          data-testid="issue-link-input"
          className="bg-surface text-content-strong flex-1 rounded-lg border border-hairline-strong px-3 py-1.5 text-xs focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        />
        <LinkSubmit />
      </div>
      {state?.error && (
        <p data-testid="issue-link-error" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

function CreateSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="issue-create-submit"
      className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Filing…" : "File issue"}
    </button>
  );
}

function CreateIssueModal({
  resultId,
  onClose,
}: {
  resultId: string;
  onClose: () => void;
}) {
  const [state, formAction] = useFormState(createIssueFromResult, undefined);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await previewIssueFromResult(resultId);
      if ("error" in res) setLoadError(res.error);
      else setDraft(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]);

  useEffect(() => {
    if (state?.ok) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 motion-safe:animate-tf-fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl motion-safe:animate-tf-pop-in">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">File an issue</h3>
            <p className="text-sm text-content-muted">
              Review what gets sent to your tracker. You can edit it first.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-content-subtle hover:text-content"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loadError && <p className="text-sm text-danger">{loadError}</p>}
        {!draft && !loadError && (
          <p className="py-8 text-center text-sm text-content-subtle">
            Building the report…
          </p>
        )}

        {draft && (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="resultId" value={resultId} />
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                Title
              </label>
              <input
                name="title"
                defaultValue={draft.title}
                data-testid="issue-create-title"
                className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-content-muted">
                Description
              </label>
              <textarea
                name="body"
                rows={14}
                defaultValue={draft.body}
                data-testid="issue-create-body"
                className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 font-mono text-xs focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <CreateSubmit />
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-content-muted hover:text-content"
              >
                Cancel
              </button>
            </div>
            {state?.error && (
              <p data-testid="issue-create-error" className="text-sm text-danger">
                {state.error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export function IssuePanel({
  entityType,
  entityId,
  links,
  canWrite,
  hasIntegration,
  canCreate,
}: {
  entityType: "CASE" | "RESULT";
  entityId: string;
  links: IssueLinkView[];
  canWrite: boolean;
  hasIntegration: boolean;
  /** RESULT + status FAILED — filing an issue only makes sense for a failure. */
  canCreate?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  // Without a tracker configured, the panel stays out of the way entirely —
  // projects that never connect one see the UI exactly as before (AC 5).
  if (!hasIntegration && links.length === 0) return null;

  return (
    <div className="space-y-2">
      <IssueBadges links={links} canWrite={canWrite} />

      {canWrite && hasIntegration && (
        <div className="space-y-2">
          {canCreate && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              data-testid="issue-create-open"
              className="inline-flex items-center gap-1.5 rounded-lg border border-danger-border px-3 py-1.5 text-xs font-medium text-danger-soft-fg hover:bg-danger-soft"
            >
              <TFIcon name="cicd" className="h-3.5 w-3.5" /> Create issue from
              failure
            </button>
          )}
          <LinkIssueForm entityType={entityType} entityId={entityId} />
        </div>
      )}

      {modalOpen && (
        <CreateIssueModal resultId={entityId} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
