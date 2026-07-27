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
        className="absolute right-2 top-2 rounded-md border border-sidebar-border bg-sidebar/80 px-2 py-1 text-xs font-medium text-sidebar-fg opacity-0 motion-safe:transition-[opacity,color,background-color] motion-safe:duration-fast motion-safe:ease-tf-out hover:bg-sidebar-hover hover:text-white focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-sidebar p-4 text-xs leading-relaxed text-sidebar-fg">
        {code}
      </pre>
    </div>
  );
}
