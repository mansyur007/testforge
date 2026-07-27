"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-sidebar-fg hover:text-white"
      >
        Log out →
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 motion-safe:animate-tf-fade-in"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-xl bg-surface-raised p-6 text-content-strong shadow-xl motion-safe:animate-tf-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold">
                Log out of your account?
              </h2>
              <p className="mt-1 text-sm text-content-muted">
                You will need to log in again to access TestForge.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-hairline-strong px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <form action={logout}>
                  <button className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
