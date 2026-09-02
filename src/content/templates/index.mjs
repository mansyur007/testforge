// F-47: the built-in template library.
//
// These packs are repo content, not database rows authored through the
// superadmin console, and that is deliberate. `/superadmin` is dormant unless
// TF_SUPERADMIN_USER and a password are both configured (src/lib/superadmin.ts)
// — which is the default — so a library that could only be authored there would
// be empty on almost every instance. Same reasoning that put the Academy's
// ShopMini fixture in `src/content` rather than in `prisma/seed.mjs`: the
// production image ships no seed script.
//
// `syncBuiltInTemplates()` (src/lib/templates/sync.ts) upserts these by slug.
// The superadmin console edits the resulting rows; it never owns them.

import { LOGIN_AUTH_TEMPLATE } from "./login-auth.mjs";
import { REGISTRATION_TEMPLATE } from "./registration.mjs";
import { CRUD_TEMPLATE } from "./crud.mjs";
import { CHECKOUT_TEMPLATE } from "./checkout.mjs";

// Order here is incidental — the gallery sorts on each pack's `order` field.
export const BUILT_IN_TEMPLATES = [
  LOGIN_AUTH_TEMPLATE,
  REGISTRATION_TEMPLATE,
  CRUD_TEMPLATE,
  CHECKOUT_TEMPLATE,
];
