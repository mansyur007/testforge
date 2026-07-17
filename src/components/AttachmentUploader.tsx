"use client";

import { useRef, useState } from "react";

export type AttachmentItem = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

// F-01: drag-drop / paste / picker upload zone + attachment grid.
// Uploads go straight to the v1 API (session cookie authenticates); parents
// pass the initial list server-side. Remount with key={entityId} when reused
// across entities (e.g. RunExecutor switching cases).
export function AttachmentUploader({
  projectSlug,
  entityType,
  entityId,
  canWrite,
  maxMb,
  initial,
}: {
  projectSlug: string;
  entityType: "CASE" | "RESULT" | "SESSION_NOTE";
  entityId: string;
  canWrite: boolean;
  maxMb: number;
  initial: AttachmentItem[];
}) {
  const [items, setItems] = useState<AttachmentItem[]>(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    setError("");
    setBusy(true);
    for (const file of Array.from(files)) {
      if (file.size > maxMb * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${maxMb} MB limit.`);
        continue;
      }
      const fd = new FormData();
      fd.set("file", file);
      fd.set("entityType", entityType);
      fd.set("entityId", entityId);
      try {
        const res = await fetch(`/api/v1/projects/${projectSlug}/attachments`, {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const item = (await res.json()) as AttachmentItem;
          setItems((xs) => [...xs, item]);
        } else {
          const body = await res.json().catch(() => null);
          setError(body?.error?.message ?? `Upload failed (${res.status}).`);
        }
      } catch {
        setError("Upload failed — network error.");
      }
    }
    setBusy(false);
  };

  const remove = async (item: AttachmentItem) => {
    if (!window.confirm(`Delete attachment "${item.filename}"?`)) return;
    const res = await fetch(
      `/api/v1/projects/${projectSlug}/attachments/${item.id}`,
      { method: "DELETE" }
    );
    if (res.ok) setItems((xs) => xs.filter((x) => x.id !== item.id));
    else {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? `Delete failed (${res.status}).`);
    }
  };

  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid="attachment-item"
              className="group relative rounded-lg border border-slate-200"
            >
              {canWrite && (
                <button
                  type="button"
                  aria-label={`Delete ${item.filename}`}
                  onClick={() => remove(item)}
                  className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-xs text-white hover:bg-red-600 group-hover:flex"
                >
                  ×
                </button>
              )}
              {item.mimeType.startsWith("image/") &&
              !item.mimeType.includes("svg") ? (
                <a href={item.url} target="_blank" rel="noreferrer" title={item.filename}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading="lazy"
                    className="h-20 w-24 rounded-lg object-cover"
                  />
                </a>
              ) : (
                <a
                  href={item.url}
                  className="flex h-20 w-32 flex-col justify-center gap-1 px-3 text-xs hover:bg-slate-50"
                  title={item.filename}
                >
                  <span className="truncate font-medium text-slate-700">
                    📎 {item.filename}
                  </span>
                  <span className="text-slate-400">{formatSize(item.sizeBytes)}</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div
          data-testid="attachment-dropzone"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          onPaste={(e) => {
            if (e.clipboardData.files.length) upload(e.clipboardData.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-3 text-center text-xs transition-colors ${
            dragOver
              ? "border-indigo-400 bg-indigo-50 text-indigo-600"
              : "border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-slate-500"
          }`}
        >
          {busy
            ? "Uploading…"
            : `Drop files, paste a screenshot, or click to browse (max ${maxMb} MB)`}
          <input
            ref={inputRef}
            data-testid="attachment-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {!canWrite && items.length === 0 && (
        <p className="text-sm text-slate-400">No attachments.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
