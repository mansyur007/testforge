import type { HelpTopic } from "./types";

export const team: HelpTopic = {
  slug: "team",
  title: "Team & roles",
  summary: "Organization vs. project membership, and what each role can do.",
  body: `
## Two layers of access

- **Organization** — the account-level container everyone in your company
  shares. It doesn't grant access to any project by itself.
- **Project membership** — each project has its own member list and role.
  Being in the organization doesn't automatically add you to a project;
  someone has to invite you to it specifically.

## Roles (per project)

| Role | Can do |
|---|---|
| **OWNER** | Everything, including removing other OWNERs and deleting the project |
| **ADMIN** | Manage members, integrations, notifications, fields; full case/run access |
| **MEMBER** | Create/edit cases, runs, and results |
| **VIEWER** | Read-only — can't write anything, including copying cases into the project |

## Inviting people

From **Settings → Team**, invite by email and choose a role. Invitations can
be resent or revoked before they're accepted, and any member's role can be
changed later.

## API keys

API keys (under **Settings → API Keys**) belong to a user, not a role
directly — a key is scoped **READ** or **WRITE**, and write actions still
require the underlying user to have write access to the project being
touched.
`,
};
