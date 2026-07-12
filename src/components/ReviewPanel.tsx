"use client";

import { useState, useTransition } from "react";
import { requestReview, approveCase, requestChanges } from "@/app/actions/review";

// F-15: the review controls on a case detail page. What shows depends on the
// case status and whether the viewer is the assigned reviewer:
//  - not in review + writer → "Request review" (pick a reviewer ≠ self)
//  - in review + you are the reviewer → Approve / Request changes (note)
//  - in review + someone else → waiting message

type Member = { id: string; name: string };

function run(
  action: (fd: FormData) => Promise<{ error?: string; ok?: boolean }>,
  fd: FormData,
  onError: (e: string) => void
) {
  return action(fd).then((res) => {
    if (res?.error) onError(res.error);
  });
}

export function ReviewPanel({
  caseId,
  status,
  canWrite,
  currentUserId,
  reviewerId,
  reviewerName,
  reviewedAt,
  reviewNote,
  members,
}: {
  caseId: string;
  status: string;
  canWrite: boolean;
  currentUserId: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  members: Member[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [note, setNote] = useState("");
  const [reviewerPick, setReviewerPick] = useState("");
  const [pending, startTransition] = useTransition();

  const others = members.filter((m) => m.id !== currentUserId);
  const isReviewer = status === "IN_REVIEW" && reviewerId === currentUserId;
  const inReview = status === "IN_REVIEW";

  const submit = (
    action: (fd: FormData) => Promise<{ error?: string; ok?: boolean }>,
    extra?: Record<string, string>
  ) => {
    setError(null);
    const fd = new FormData();
    fd.set("caseId", caseId);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    startTransition(() => run(action, fd, setError));
  };

  return (
    <div className="space-y-3" data-testid="review-panel">
      {/* Changes-requested note carries over into DRAFT so the author sees it. */}
      {reviewNote && !inReview && (
        <div
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
          data-testid="review-note"
        >
          <span className="font-semibold">Changes requested</span>
          {reviewerName ? ` by ${reviewerName}` : ""}: {reviewNote}
        </div>
      )}

      {inReview && (
        <p className="text-sm text-slate-600" data-testid="review-status">
          {isReviewer ? (
            <>Awaiting <b>your</b> review.</>
          ) : (
            <>
              In review — assigned to <b>{reviewerName ?? "a reviewer"}</b>.
            </>
          )}
        </p>
      )}

      {status === "APPROVED" && (
        <p className="text-sm text-green-700" data-testid="review-approved">
          Approved{reviewerName ? ` by ${reviewerName}` : ""}
          {reviewedAt ? ` on ${new Date(reviewedAt).toLocaleDateString("en-US")}` : ""}.
        </p>
      )}

      {/* Reviewer actions */}
      {isReviewer && !changing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(approveCase)}
            data-testid="review-approve"
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setChanging(true)}
            data-testid="review-request-changes-open"
            className="rounded-lg border border-amber-300 px-4 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            ↩ Request changes
          </button>
        </div>
      )}

      {isReviewer && changing && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What needs to change? (required)"
            data-testid="review-changes-note"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(requestChanges, { note })}
              data-testid="review-changes-submit"
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Send back to author
            </button>
            <button
              type="button"
              onClick={() => {
                setChanging(false);
                setNote("");
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Author action: request a review (also to re-review an approved case). */}
      {canWrite && !inReview && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reviewerPick}
            onChange={(e) => setReviewerPick(e.target.value)}
            data-testid="review-reviewer-select"
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Pick a reviewer…</option>
            {others.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !reviewerPick}
            onClick={() => submit(requestReview, { reviewerId: reviewerPick })}
            data-testid="review-request"
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Request review
          </button>
          {others.length === 0 && (
            <span className="text-xs text-slate-400">
              Invite a teammate to request a review.
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600" data-testid="review-error">
          {error}
        </p>
      )}
    </div>
  );
}
