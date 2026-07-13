"use client";

import { useState } from "react";

// F-17: copies the absolute share URL (origin + path) to the clipboard.
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.origin + path);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100"
      data-testid="share-copy-button"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
