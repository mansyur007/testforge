"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addNote } from "@/app/actions/sessions";
import {
  SESSION_NOTE_HOTKEYS,
  SESSION_NOTE_KINDS,
  SESSION_NOTE_BADGES,
  type SessionNoteKind,
} from "@/lib/constants";

// F-25: the live session page — a running timer against the timebox, and a
// quick-add note composer with N/B/Q/I hotkeys. Hotkeys just pick the kind
// and focus the textarea; Enter never submits (notes are often multi-line),
// Cmd/Ctrl+Enter does.

function elapsedLabel(startedAt: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Timer({ startedAt, timeboxMinutes }: { startedAt: string; timeboxMinutes: number }) {
  const [label, setLabel] = useState(() => elapsedLabel(startedAt));
  const [over, setOver] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(elapsedLabel(startedAt));
      setOver(Date.now() - new Date(startedAt).getTime() > timeboxMinutes * 60_000);
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, timeboxMinutes]);

  return (
    <span
      data-testid="session-timer"
      className={`font-mono text-2xl font-bold tabular-nums ${over ? "text-danger" : "text-content-strong"}`}
    >
      {label}
      <span className="ml-2 text-sm font-normal text-content-subtle">/ {timeboxMinutes}m</span>
    </span>
  );
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="session-note-submit"
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Adding…" : "Add note"}
    </button>
  );
}

export function SessionRunner({
  sessionId,
  startedAt,
  timeboxMinutes,
}: {
  sessionId: string;
  startedAt: string;
  timeboxMinutes: number;
}) {
  const [kind, setKind] = useState<SessionNoteKind>("NOTE");
  const [state, formAction] = useFormState(addNote, undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable);
      if (typing) return;
      const letter = e.key.toLowerCase();
      if (letter in SESSION_NOTE_HOTKEYS) {
        e.preventDefault();
        setKind(SESSION_NOTE_HOTKEYS[letter]);
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Live session</h3>
        <Timer startedAt={startedAt} timeboxMinutes={timeboxMinutes} />
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-2"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="kind" value={kind} />

        <div className="flex gap-1.5" data-testid="session-kind-picker">
          {SESSION_NOTE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                textareaRef.current?.focus();
              }}
              data-testid={`session-kind-${k}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                kind === k ? SESSION_NOTE_BADGES[k] : "bg-canvas text-content-subtle hover:bg-surface-muted"
              }`}
              title={`Hotkey: ${k[0]}`}
            >
              {k[0]} · {k}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          name="bodyMd"
          required
          rows={3}
          placeholder="What did you find? (Cmd/Ctrl+Enter to add)"
          data-testid="session-note-input"
          className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm"
        />

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-content-muted">
            📎 Attach
            <input
              type="file"
              name="attachment"
              data-testid="session-note-attachment"
              className="hidden"
            />
          </label>
          <AddButton />
        </div>

        {state?.error && (
          <p data-testid="session-note-error" className="text-xs text-danger">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
