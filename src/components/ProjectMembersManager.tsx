"use client";

import { useState, useTransition } from "react";
import {
  addProjectMember,
  changeProjectMemberRole,
  removeProjectMember,
  type ProjectMemberResult,
} from "@/app/actions/project-members";

type Member = { userId: string; name: string; email: string; role: string };
type Addable = { id: string; name: string; email: string };

const BUILT_IN_OPTIONS = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "OWNER"
      ? "bg-accent-soft text-accent-soft-fg"
      : role === "ADMIN"
        ? "bg-info-soft text-info-soft-fg"
        : role === "VIEWER"
          ? "bg-surface-muted text-content"
          : role === "MEMBER"
            ? "bg-success-soft text-success-soft-fg"
            : "bg-warning-soft text-warning-soft-fg"; // F-14: custom role
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {role}
    </span>
  );
}

export function ProjectMembersManager({
  projectId,
  canManage,
  currentUserId,
  members,
  addable,
  hasOrg,
  customRoles = [],
}: {
  projectId: string;
  canManage: boolean;
  currentUserId: string;
  members: Member[];
  addable: Addable[];
  hasOrg: boolean;
  customRoles?: string[]; // F-14: org RoleDef names
}) {
  const ROLE_OPTIONS = [...BUILT_IN_OPTIONS, ...customRoles];
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<ProjectMemberResult | null>(null);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("MEMBER");

  function run(action: () => Promise<ProjectMemberResult>) {
    startTransition(async () => {
      const res = await action();
      setMsg(res);
      if (res.ok && !res.error) setAddUserId("");
    });
  }

  function fd(entries: Record<string, string>) {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {msg?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {msg.error}
        </p>
      )}
      {msg?.ok && (
        <p className="rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success-soft-fg">
          {msg.ok}
        </p>
      )}

      {!canManage && (
        <p className="rounded-lg bg-warning-soft px-4 py-2.5 text-sm text-warning-soft-fg">
          You can view this project&apos;s members, but only owners and admins
          can add or change them.
        </p>
      )}

      {/* Add member */}
      {canManage && (
        <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">Add a member</h2>
            <p className="text-sm text-content-muted">
              Pick someone from your organization and choose their project role.
            </p>
          </div>
          {!hasOrg ? (
            <p className="text-sm text-content-subtle">
              You are not part of an organization yet.
            </p>
          ) : addable.length === 0 ? (
            <p className="text-sm text-content-subtle">
              Everyone in your organization is already a member. Invite more
              people in Settings → Team.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="min-w-[16rem] rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              >
                <option value="">Select a person…</option>
                {addable.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending || !addUserId}
                onClick={() =>
                  run(() =>
                    addProjectMember(
                      fd({ projectId, userId: addUserId, role: addRole })
                    )
                  )
                }
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add member"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Members */}
      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <h2 className="text-lg font-semibold">
          Members{" "}
          <span className="text-sm font-normal text-content-subtle">
            ({members.length})
          </span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-content-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Member</th>
                <th className="px-4 py-2.5 font-medium">Project role</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-subtle">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                return (
                  <tr key={m.userId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-content-strong">
                        {m.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-content-subtle">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-content-muted">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          defaultValue={m.role}
                          disabled={pending}
                          onChange={(e) =>
                            run(() =>
                              changeProjectMemberRole(
                                fd({
                                  projectId,
                                  userId: m.userId,
                                  role: e.target.value,
                                })
                              )
                            )
                          }
                          className="rounded-lg border border-hairline-strong px-2 py-1 text-xs focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            const verb = isSelf ? "Leave this project" : `Remove ${m.email}`;
                            if (confirm(`${verb}?`))
                              run(() =>
                                removeProjectMember(
                                  fd({ projectId, userId: m.userId })
                                )
                              );
                          }}
                          className="text-xs font-medium text-danger hover:text-danger-soft-fg disabled:opacity-50"
                        >
                          {isSelf ? "Leave" : "Remove"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
