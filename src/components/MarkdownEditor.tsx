"use client";

import { useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";

// F-02: Markdown textarea with Write/Preview tabs, a tiny formatting toolbar,
// and paste-a-screenshot upload (via the F-01 attachments API — only active
// when projectSlug + entityType + entityId are provided, i.e. the entity
// already exists). Drop-in replacement for a plain <textarea name=...>:
// uncontrolled with `name`/`defaultValue` inside a <form>, or controlled with
// `value`/`onChange`. The textarea stays mounted during preview (hidden) so
// FormData submission always sees it.

const inputCls =
  "w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring";

export function MarkdownEditor({
  name,
  defaultValue,
  value,
  onChange,
  rows = 3,
  placeholder,
  projectSlug,
  entityType,
  entityId,
  testId,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  rows?: number;
  placeholder?: string;
  projectSlug?: string;
  entityType?: "CASE" | "RESULT";
  entityId?: string;
  testId?: string;
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [notice, setNotice] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const text = controlled ? value : inner;
  const update = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  };

  // Insert/wrap at the current selection and restore focus.
  const edit = (fn: (sel: string) => string) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const next = text.slice(0, s) + fn(text.slice(s, e)) + text.slice(e);
    update(next);
    requestAnimationFrame(() => ta.focus());
  };

  const canPaste = Boolean(projectSlug && entityType && entityId);
  const pasteUpload = async (files: FileList) => {
    setNotice("Uploading…");
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("entityType", entityType!);
      fd.set("entityId", entityId!);
      const res = await fetch(`/api/v1/projects/${projectSlug}/attachments`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const a = (await res.json()) as { url: string; filename: string };
        edit((sel) => `${sel}![${a.filename}](${a.url})`);
        setNotice("");
      } else {
        const body = await res.json().catch(() => null);
        setNotice(body?.error?.message ?? `Upload failed (${res.status}).`);
      }
    }
  };

  const toolBtn =
    "rounded px-1.5 py-0.5 text-xs text-content-muted hover:bg-surface-muted";

  return (
    <div className="rounded-lg border border-hairline-strong focus-within:border-accent">
      <div className="flex items-center gap-1 border-b border-hairline bg-canvas px-2 py-1 rounded-t-lg">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
              tab === t ? "bg-surface text-accent-soft-fg shadow-sm" : "text-content-muted"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-surface-muted" />
        <button type="button" className={`${toolBtn} font-bold`} title="Bold"
          onClick={() => edit((s) => `**${s || "bold"}**`)}>B</button>
        <button type="button" className={`${toolBtn} italic`} title="Italic"
          onClick={() => edit((s) => `_${s || "italic"}_`)}>I</button>
        <button type="button" className={`${toolBtn} font-mono`} title="Code"
          onClick={() => edit((s) => `\`${s || "code"}\``)}>{"</>"}</button>
        <button type="button" className={toolBtn} title="List"
          onClick={() => edit((s) => `\n- ${s || "item"}`)}>≡</button>
        <button type="button" className={toolBtn} title="Link"
          onClick={() => edit((s) => `[${s || "text"}](https://)`)}>🔗</button>
        <span className="ml-auto text-[10px] text-content-subtle">
          Markdown{canPaste ? " · paste an image to attach" : ""}
        </span>
      </div>

      <textarea
        ref={ref}
        name={name}
        rows={rows}
        value={text}
        onChange={(e) => update(e.target.value)}
        onPaste={(e) => {
          if (canPaste && e.clipboardData.files.length) {
            e.preventDefault();
            pasteUpload(e.clipboardData.files);
          }
        }}
        placeholder={placeholder}
        data-testid={testId}
        className={`${inputCls} rounded-t-none border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring ${
          tab === "preview" ? "hidden" : ""
        }`}
      />
      {tab === "preview" && (
        <div className="min-h-[4rem] px-3 py-2">
          {text.trim() ? (
            <Markdown>{text}</Markdown>
          ) : (
            <p className="text-sm text-content-subtle">Nothing to preview.</p>
          )}
        </div>
      )}
      {notice && <p className="px-3 pb-2 text-xs text-warning">{notice}</p>}
    </div>
  );
}
