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
        className="text-xs text-slate-400 hover:text-white"
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
              className="w-full max-w-sm rounded-xl bg-white p-6 text-slate-900 shadow-xl motion-safe:animate-tf-pop-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold">
                Log out of your account?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                You will need to log in again to access TestForge.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <form action={logout}>
                  <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
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
