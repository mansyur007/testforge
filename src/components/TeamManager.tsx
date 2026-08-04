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
      ? "bg-accent-soft text-accent-soft-fg"
      : role === "VIEWER"
        ? "bg-surface-muted text-content"
        : "bg-info-soft text-info-soft-fg";
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
        <p className="text-sm text-content-muted">
          Members and invitations for {orgName}.
        </p>
      </div>

      {msg?.error && (
        <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {msg.error}
        </p>
      )}
      {msg?.ok && (
        <div className="rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success-soft-fg">
          <p>{msg.ok}</p>
          {msg.devLinks?.length ? (
            <ul className="mt-2 space-y-1 break-all font-mono text-xs text-success-soft-fg">
              {msg.devLinks.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {!isAdmin && (
        <p className="rounded-lg bg-warning-soft px-4 py-2.5 text-sm text-warning-soft-fg">
          You can view the team, but only admins can invite or manage members.
        </p>
      )}

      {/* Invite */}
      {isAdmin && (
        <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">Invite members</h2>
            <p className="text-sm text-content-muted">
              Separate multiple emails with commas or new lines.
            </p>
          </div>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={3}
            placeholder="teammate@example.com, another@example.com"
            className="w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          />
          <div className="flex items-center gap-3">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
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
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send invitations"}
            </button>
          </div>
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
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-subtle">
              {members.map((m) => {
                const isSelf = m.id === currentUserId;
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-content-strong">
                        {m.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-content-subtle">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-content-muted">
                        {m.email}
                        {!m.emailVerified && (
                          <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning-soft-fg">
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
                    <td className="px-4 py-3 text-content-muted">
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
                            className="text-xs font-medium text-danger hover:text-danger-soft-fg disabled:opacity-50"
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
      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <h2 className="text-lg font-semibold">
          Pending invitations{" "}
          <span className="text-sm font-normal text-content-subtle">
            ({invitations.length})
          </span>
        </h2>
        {invitations.length === 0 ? (
          <p className="text-sm text-content-subtle">No pending invitations.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-content-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Invited</th>
                  {isAdmin && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-subtle">
                {invitations.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 text-content-strong">{i.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={i.role} />
                    </td>
                    <td className="px-4 py-3 text-content-muted">
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
                            className="text-xs font-medium text-accent-text hover:text-accent-soft-fg disabled:opacity-50"
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
                            className="text-xs font-medium text-danger hover:text-danger-soft-fg disabled:opacity-50"
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
