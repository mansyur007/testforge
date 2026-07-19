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
      ? "bg-violet-100 text-violet-700"
      : role === "ADMIN"
        ? "bg-indigo-100 text-indigo-700"
        : role === "VIEWER"
          ? "bg-slate-100 text-slate-600"
          : role === "MEMBER"
            ? "bg-sky-100 text-sky-700"
            : "bg-teal-100 text-teal-700"; // F-14: custom role
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
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {msg.error}
        </p>
      )}
      {msg?.ok && (
        <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {msg.ok}
        </p>
      )}

      {!canManage && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          You can view this project&apos;s members, but only owners and admins
          can add or change them.
        </p>
      )}

      {/* Add member */}
      {canManage && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold">Add a member</h2>
            <p className="text-sm text-slate-500">
              Pick someone from your organization and choose their project role.
            </p>
          </div>
          {!hasOrg ? (
            <p className="text-sm text-slate-400">
              You are not part of an organization yet.
            </p>
          ) : addable.length === 0 ? (
            <p className="text-sm text-slate-400">
              Everyone in your organization is already a member. Invite more
              people in Settings → Team.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="min-w-[16rem] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add member"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Members */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Members{" "}
          <span className="text-sm font-normal text-slate-400">
            ({members.length})
          </span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Member</th>
                <th className="px-4 py-2.5 font-medium">Project role</th>
                {canManage && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                return (
                  <tr key={m.userId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {m.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-400">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{m.email}</div>
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
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
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
