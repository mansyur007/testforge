import crypto from "crypto";
import { db } from "@/lib/db";

// Events a webhook (and, since F-08, a notification channel) can subscribe to.
// Kept small and explicit. `milestone.completed` is in the vocabulary but has
// no producer yet — the app has no milestone-completion flow (comes with F-06).
export const WEBHOOK_EVENTS = [
  "case.created",
  "case.updated",
  "case.deleted",
  "case.assigned",
  "run.created",
  "run.completed",
  "result.failed",
  "issue.created",
  "milestone.completed",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** HMAC-SHA256 of the raw body, hex — sent as `sha256=<hex>`. */
export function signPayload(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Best-effort delivery: POST a signed JSON payload to every active webhook in
 * the project that subscribes to `event`. Fire-and-forget with a short timeout —
 * a slow or dead endpoint never blocks or fails the originating request.
 */
export async function dispatchWebhook(
  projectId: string,
  event: WebhookEvent,
  data: unknown
): Promise<void> {
  const hooks = await db.webhook.findMany({
    where: { projectId, active: true },
  });
  if (hooks.length === 0) return;

  const body = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const hook of hooks) {
    if (!hook.events.split(",").includes(event)) continue;
    // Not awaited: delivery must not delay the API response.
    fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TestForge-Event": event,
        "X-TestForge-Signature": `sha256=${signPayload(hook.secret, body)}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // best-effort — swallow network/timeout errors
    });
  }
}
