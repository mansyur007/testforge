"use client";

import { useEffect } from "react";

// F-35: floating "Print / Save as PDF" control for the print route group.
// Hidden by @media print (its own inline media query below) so it never bleeds
// into the paper output or the exported PDF. Setting document.title before
// window.print() makes `title` the browser's default PDF filename — the
// cheapest professional touch in the whole feature.
export function PrintToolbar({ title }: { title: string }) {
  // Keep the tab/window title in sync so a manual Ctrl/Cmd-P (not just the
  // button) also produces a well-named PDF.
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div
      data-testid="print-toolbar"
      style={{ position: "fixed", right: "20px", bottom: "20px", zIndex: 50 }}
      className="flex items-center gap-3 print:hidden"
    >
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.close();
        }}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        Close
      </a>
      <button
        type="button"
        data-testid="print-button"
        onClick={() => {
          document.title = title;
          window.print();
        }}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg"
        style={{ backgroundColor: "#4f46e5" }}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
