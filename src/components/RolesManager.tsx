"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRole, updateRole, deleteRole } from "@/app/actions/roles";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_PRESETS,
  BUILT_IN_ROLES,
} from "@/lib/permissions";

// F-14: org-level custom roles. Built-ins are shown read-only as reference;
// custom roles pick from the permission keys and become assignable on any
// project's Members tab.

export type RoleView = { id: string; name: string; permissions: string[] };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-sidebar px-3 py-1.5 text-xs font-medium text-white hover:bg-sidebar-hover disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

function PermissionChecks({
  defaults,
  idPrefix,
}: {
  defaults: string[];
  idPrefix: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {PERMISSIONS.map((p) => (
        <label
          key={p}
          htmlFor={`${idPrefix}-${p}`}
          className="flex items-center gap-2 text-xs text-content"
        >
          <input
            id={`${idPrefix}-${p}`}
            type="checkbox"
            name="permissions"
            value={p}
            defaultChecked={defaults.includes(p)}
          />
          <span>
            <code className="rounded bg-surface-muted px-1">{p}</code>{" "}
            {PERMISSION_LABELS[p]}
          </span>
        </label>
      ))}
    </div>
  );
}

function CustomRoleRow({ role }: { role: RoleView }) {
  const [saveState, saveAction] = useFormState(updateRole, undefined);
  const [deleteState, deleteAction] = useFormState(deleteRole, undefined);
  return (
    <li className="py-3" data-testid={`role-row-${role.name}`}>
      <form action={saveAction} className="space-y-2">
        <input type="hidden" name="id" value={role.id} />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{role.name}</p>
          <div className="flex items-center gap-2">
            <Submit label="Save" />
            <button
              type="submit"
              formAction={deleteAction}
              className="text-xs text-content-subtle hover:text-danger"
              data-testid={`role-delete-${role.name}`}
            >
              Delete
            </button>
          </div>
        </div>
        <PermissionChecks defaults={role.permissions} idPrefix={role.id} />
        {(saveState?.error || deleteState?.error) && (
          <p className="text-xs text-danger">
            {saveState?.error ?? deleteState?.error}
          </p>
        )}
      </form>
    </li>
  );
}

export function RolesManager({ roles }: { roles: RoleView[] }) {
  const [state, formAction] = useFormState(createRole, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
      <div>
        <h2 className="text-lg font-semibold">Roles</h2>
        <p className="text-sm text-content-muted">
          Custom project roles with explicit permissions — assign them on a
          project&apos;s Members tab. Built-in roles are fixed presets.
        </p>
      </div>

      {/* Built-in presets, read-only reference */}
      <div className="flex flex-wrap gap-2 text-xs text-content-muted">
        {BUILT_IN_ROLES.map((r) => (
          <span
            key={r}
            className="rounded-full bg-surface-muted px-2 py-1"
            title={
              ROLE_PRESETS[r].length
                ? ROLE_PRESETS[r].join(", ")
                : "read-only"
            }
          >
            {r}:{" "}
            {r === "OWNER" || r === "ADMIN"
              ? "everything"
              : r === "MEMBER"
                ? "write cases & runs"
                : "read-only"}
          </span>
        ))}
      </div>

      {roles.length > 0 && (
        <ul className="divide-y divide-hairline-subtle">
          {roles.map((r) => (
            <CustomRoleRow key={r.id} role={r} />
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-2 border-t border-hairline-subtle pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            required
            placeholder='New role name, e.g. "Executor"'
            data-testid="role-name-input"
            className="bg-surface text-content-strong w-56 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <Submit label="+ Role" />
        </div>
        <PermissionChecks defaults={[]} idPrefix="new-role" />
        {state?.error && (
          <p className="text-xs text-danger" data-testid="role-form-error">
            {state.error}
          </p>
        )}
      </form>
    </section>
  );
}
