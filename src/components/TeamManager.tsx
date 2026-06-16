"use client";

import { useState, useTransition } from "react";
import {
  inviteTeam,
  resendInvite,
  revokeInvite,
  changeMemberRole,
  removeMember,
  type TeamResult,
} from "@/app/actions/team";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  joinedAt: string;
};
type Invite = { id: string; email: string; role: string; invitedAt: string };

const ROLE_OPTIONS = ["ADMIN", "MEMBER", "VIEWER"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "ADMIN"
      ? "bg-indigo-100 text-indigo-700"
      : role === "VIEWER"
        ? "bg-slate-100 text-slate-600"
        : "bg-sky-100 text-sky-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {role}
    </span>
  );
}

export function TeamManager({
  orgName,
  isAdmin,
  currentUserId,
  members,
  invitations,
}: {
  orgName: string;
  isAdmin: boolean;
  currentUserId: string;
  members: Member[];
  invitations: Invite[];
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<TeamResult | null>(null);
  const [emails, setEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  function run(action: () => Promise<TeamResult>) {
    startTransition(async () => {
      const res = await action();
      setMsg(res);
      if (res.ok && !res.error) setEmails("");
    });
  }

  function fd(entries: Record<string, string>) {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-slate-500">
          Members and invitations for {orgName}.
        </p>
      </div>

      {msg?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {msg.error}
        </p>
      )}
      {msg?.ok && (
        <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <p>{msg.ok}</p>
          {msg.devLinks?.length ? (
            <ul className="mt-2 space-y-1 break-all font-mono text-xs text-green-800">
              {msg.devLinks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          You can view the team, but only admins can invite or manage members.
        </p>
      )}

      {/* Invite */}
      {isAdmin && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold">Invite members</h2>
            <p className="text-sm text-slate-500">
              Separate multiple emails with commas or new lines.
            </p>
          </div>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={3}
            placeholder="teammate@example.com, another@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="button"
              disabled={pending || !emails.trim()}
              onClick={() =>
                run(() => inviteTeam(fd({ emails, role: inviteRole })))
              }
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send invitations"}
            </button>
          </div>
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
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const isSelf = m.id === currentUserId;
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {m.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-400">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {m.email}
                        {!m.emailVerified && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && !isSelf ? (
                        <select
                          defaultValue={m.role}
                          disabled={pending}
                          onChange={(e) =>
                            run(() =>
                              changeMemberRole(
                                fd({ userId: m.id, role: e.target.value })
                              )
                            )
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
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
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDate(m.joinedAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Remove ${m.email} from ${orgName}? They lose access to the organization.`
                                )
                              )
                                run(() => removeMember(fd({ userId: m.id })));
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending invitations */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Pending invitations{" "}
          <span className="text-sm font-normal text-slate-400">
            ({invitations.length})
          </span>
        </h2>
        {invitations.length === 0 ? (
          <p className="text-sm text-slate-400">No pending invitations.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Invited</th>
                  {isAdmin && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 text-slate-800">{i.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={i.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDate(i.invitedAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                resendInvite(fd({ invitationId: i.id }))
                              )
                            }
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                          >
                            Resend
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              if (confirm(`Revoke the invitation to ${i.email}?`))
                                run(() =>
                                  revokeInvite(fd({ invitationId: i.id }))
                                );
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
