import { db } from "@/lib/db";

// F-14: central permission check. Two access layers stay as before —
// org-level User.role (ADMIN = manage everything, VIEWER = read-only
// everywhere) and per-project ProjectMember.role. What's new: a member's role
// may be a custom RoleDef name (per organization) carrying an explicit
// permission set, and every scattered `role === "VIEWER"` check funnels
// through can()/loadPerms() instead.
//
// Precedence: project membership is required first (no membership = no
// permissions, org admins included — page access already works that way via
// memberScope); then org ADMIN → everything, org VIEWER → nothing, else the
// membership role resolves to a built-in preset or a RoleDef. A role name
// that resolves to nothing (RoleDef deleted) degrades to read-only, never up.

export const PERMISSIONS = [
  "case.write",
  "run.execute",
  "run.manage",
  "project.admin",
  "members.manage",
  "integrations.manage",
  "fields.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "case.write": "Create & edit test cases",
  "run.execute": "Execute runs (submit results)",
  "run.manage": "Create, complete & manage runs and plans",
  "project.admin": "Project administration (webhooks, notifications)",
  "members.manage": "Manage project members",
  "integrations.manage": "Manage issue-tracker integrations",
  "fields.manage": "Manage fields, statuses, configurations & environments",
};

export const BUILT_IN_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

export const ROLE_PRESETS: Record<string, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: PERMISSIONS,
  MEMBER: ["case.write", "run.execute", "run.manage"],
  VIEWER: [],
};

export type ProjectPerms = {
  /** The membership role name (built-in or custom), null when not a member. */
  role: string | null;
  has: (p: Permission) => boolean;
};

const NONE: ProjectPerms = { role: null, has: () => false };

function fromSet(role: string, perms: readonly Permission[]): ProjectPerms {
  const set = new Set(perms);
  return { role, has: (p) => set.has(p) };
}

export async function loadPerms(
  userId: string,
  projectId: string
): Promise<ProjectPerms> {
  const [user, membership] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    }),
    db.projectMember.findFirst({
      where: { projectId, userId },
      select: { role: true },
    }),
  ]);
  if (!user || !membership) return NONE;
  if (user.role === "ADMIN") return fromSet(membership.role, PERMISSIONS);
  if (user.role === "VIEWER") return fromSet(membership.role, []);

  const preset = ROLE_PRESETS[membership.role];
  if (preset) return fromSet(membership.role, preset);

  // Custom role: resolve by (organization, name); unknown → read-only.
  if (!user.organizationId) return fromSet(membership.role, []);
  const def = await db.roleDef.findUnique({
    where: {
      organizationId_name: {
        organizationId: user.organizationId,
        name: membership.role,
      },
    },
  });
  if (!def) return fromSet(membership.role, []);
  let parsed: unknown;
  try {
    parsed = JSON.parse(def.permissionsJson);
  } catch {
    parsed = [];
  }
  const valid = (Array.isArray(parsed) ? parsed : []).filter((p): p is Permission =>
    (PERMISSIONS as readonly string[]).includes(String(p))
  );
  return fromSet(membership.role, valid);
}

export async function can(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<boolean> {
  return (await loadPerms(userId, projectId)).has(permission);
}
