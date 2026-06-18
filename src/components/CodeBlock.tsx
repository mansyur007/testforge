"use client";

import { useState } from "react";

// Code block with a hover copy button — used for CI/CD snippets on the API tab.
export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="group relative">
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-300 opacity-0 transition hover:bg-slate-700 hover:text-white focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        {code}
      </pre>
    </div>
  );
}
