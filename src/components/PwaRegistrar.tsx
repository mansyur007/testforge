"use client";

import { useEffect } from "react";

// F-36 Part B: registers /sw.js once, in production only. Renders nothing.
// NEVER register in dev — a dev-cached service worker poisons localhost for
// every other project sharing the origin/port.
export function PwaRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal: the app works without the SW.
      });
    }
  }, []);
  return null;
}
