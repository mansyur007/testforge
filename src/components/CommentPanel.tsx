"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Markdown } from "@/components/Markdown";
import {
  listComments,
  createComment,
  editComment,
  deleteComment,
} from "@/app/actions/comments";
import type { CommentView } from "@/lib/comments";

// F-16: flat comment thread with @mention autocomplete. Mounted on the case
// page, the run page, and per-result inside the run executor. Reads/writes go
// through server actions so it works the same in all three (no navigation).

type Member = { id: string; name: string; email: string };
const MENTION_TOKEN = /@\[([a-z0-9]+)\]/g;

// Store form ("...@[userId]...") -> display form ("...@Name...") for editing,
// plus the mentions to seed so a re-save re-encodes them.
function decodeForEdit(
  bodyMd: string,
  mentionNames: Record<string, string>
): { body: string; mentions: { id: string; name: string }[] } {
  const mentions: { id: string; name: string }[] = [];
  const body = bodyMd.replace(MENTION_TOKEN, (_m, id: string) => {
    const name = mentionNames[id] ?? "unknown";
    mentions.push({ id, name });
    return `@${name}`;
  });
  return { body, mentions };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US");
}

// Renders a stored body (with `@[userId]` tokens) as markdown with inline
// mention chips. Text runs go through the sanitized markdown renderer.
function CommentBody({
  bodyMd,
  mentionNames,
}: {
  bodyMd: string;
  mentionNames: Record<string, string>;
}) {
  MENTION_TOKEN.lastIndex = 0;
  if (!MENTION_TOKEN.test(bodyMd))
    return <Markdown className="tf-comment-body">{bodyMd}</Markdown>;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  MENTION_TOKEN.lastIndex = 0;
  for (const m of Array.from(bodyMd.matchAll(MENTION_TOKEN))) {
    const idx = m.index ?? 0;
    if (idx > last)
      parts.push(
        <Markdown inline key={key++}>
          {bodyMd.slice(last, idx)}
        </Markdown>
      );
    const id = m[1];
    parts.push(
      <span key={key++} className="tf-mention" data-testid="comment-mention">
        @{mentionNames[id] ?? "unknown"}
      </span>
    );
    last = idx + m[0].length;
  }
  if (last < bodyMd.length)
    parts.push(
      <Markdown inline key={key++}>
        {bodyMd.slice(last)}
      </Markdown>
    );

  return <div className="tf-comment-body text-sm leading-relaxed">{parts}</div>;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

// The composer is shared by the new-comment box and inline editing.
function Composer({
  slug,
  initialBody = "",
  initialMentions = [],
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  slug: string;
  initialBody?: string;
  initialMentions?: { id: string; name: string }[];
  submitLabel: string;
  onSubmit: (body: string, mentionUserIds: string[]) => Promise<string | null>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [mentions, setMentions] =
    useState<{ id: string; name: string }[]>(initialMentions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // @mention autocomplete state
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [suggests, setSuggests] = useState<Member[]>([]);
  const [active, setActive] = useState(0);
  const [queryRange, setQueryRange] = useState<{ start: number; end: number } | null>(
    null
  );

  const closeSuggest = () => {
    setSuggests([]);
    setQueryRange(null);
  };

  const runQuery = useCallback(
    async (q: string) => {
      try {
        const res = await fetch(
          `/api/projects/${slug}/members?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) return setSuggests([]);
        const json = await res.json();
        setSuggests(json.data ?? []);
        setActive(0);
      } catch {
        setSuggests([]);
      }
    },
    [slug]
  );

  // On every change, detect an "@query" ending at the caret.
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBody(value);
    const caret = e.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = /(^|\s)@(\w{0,30})$/.exec(before);
    if (match) {
      const start = caret - match[2].length - 1; // include the '@'
      setQueryRange({ start, end: caret });
      runQuery(match[2]);
    } else {
      closeSuggest();
    }
  };

  const pick = (member: Member) => {
    if (!queryRange) return;
    const next =
      body.slice(0, queryRange.start) +
      `@${member.name} ` +
      body.slice(queryRange.end);
    setBody(next);
    setMentions((prev) =>
      prev.some((m) => m.id === member.id) ? prev : [...prev, member]
    );
    closeSuggest();
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggests.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggests.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggests.length) % suggests.length);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        pick(suggests[active]);
      } else if (e.key === "Escape") {
        closeSuggest();
      }
    }
  };

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return setError("Comment can't be empty.");
    // Only send mentions whose "@Name" is still present in the text.
    const activeIds = mentions
      .filter((m) => body.includes(`@${m.name}`))
      .map((m) => m.id);
    setError(null);
    startTransition(async () => {
      const err = await onSubmit(trimmed, activeIds);
      if (err) setError(err);
      else {
        setBody("");
        setMentions([]);
      }
    });
  };

  return (
    <div className="relative space-y-2">
      <textarea
        ref={taRef}
        value={body}
        onChange={onChange}
        onKeyDown={onKeyDown}
        rows={3}
        autoFocus={autoFocus}
        data-testid="comment-input"
        placeholder="Write a comment… use @ to mention a teammate. Markdown supported."
        className={`${inputCls} resize-y`}
      />
      {suggests.length > 0 && (
        <ul
          data-testid="mention-suggestions"
          className="absolute z-20 max-h-52 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {suggests.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m);
                }}
                data-testid={`mention-option-${m.name}`}
                className={`flex w-full flex-col px-3 py-1.5 text-left hover:bg-indigo-50 ${
                  i === active ? "bg-indigo-50" : ""
                }`}
              >
                <span className="font-medium text-slate-700">{m.name}</span>
                <span className="text-xs text-slate-400">{m.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          data-testid="comment-submit"
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function CommentPanel({
  entityType,
  entityId,
  projectSlug,
}: {
  entityType: "CASE" | "RUN" | "RESULT";
  entityId: string;
  projectSlug: string;
}) {
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    listComments(entityType, entityId).then((c) => {
      if (alive) setComments(c);
    });
    return () => {
      alive = false;
    };
  }, [entityType, entityId]);

  const onCreate = async (body: string, mentionUserIds: string[]) => {
    const res = await createComment({ entityType, entityId, body, mentionUserIds });
    if (res.error) return res.error;
    if (res.comments) setComments(res.comments);
    return null;
  };

  const onEdit = (commentId: string) => async (
    body: string,
    mentionUserIds: string[]
  ) => {
    const res = await editComment({ commentId, body, mentionUserIds });
    if (res.error) return res.error;
    if (res.comments) setComments(res.comments);
    setEditingId(null);
    return null;
  };

  const onDelete = (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteComment(commentId);
      if (res.comments) setComments(res.comments);
    });
  };

  const count = comments?.filter((c) => !c.deleted).length ?? 0;

  return (
    <section className="space-y-4" data-testid="comment-panel">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Comments{count > 0 ? ` (${count})` : ""}
      </h3>

      {comments === null ? (
        <p className="text-sm text-slate-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} data-testid="comment-item" className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {c.authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {c.authorName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {relativeTime(c.createdAt)}
                    {c.edited && " · edited"}
                  </span>
                </div>
                {c.deleted ? (
                  <p className="text-sm italic text-slate-400">
                    This comment was deleted.
                  </p>
                ) : editingId === c.id ? (
                  <div className="mt-1">
                    <Composer
                      slug={projectSlug}
                      autoFocus
                      submitLabel="Save"
                      {...decodeForEdit(c.bodyMd, c.mentionNames)}
                      onSubmit={onEdit(c.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <>
                    <CommentBody bodyMd={c.bodyMd} mentionNames={c.mentionNames} />
                    {(c.canEdit || c.canDelete) && (
                      <div className="mt-1 flex gap-3 text-xs text-slate-400">
                        {c.canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditingId(c.id)}
                            className="hover:text-indigo-600"
                          >
                            Edit
                          </button>
                        )}
                        {c.canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(c.id)}
                            data-testid="comment-delete"
                            className="hover:text-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Composer slug={projectSlug} submitLabel="Comment" onSubmit={onCreate} />
    </section>
  );
}
