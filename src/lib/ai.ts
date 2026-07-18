import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

// F-29: AI assist (BYO key). Org-level config for an Anthropic-compatible
// Messages endpoint. The API key is stored AES-256-GCM encrypted (F-07 crypto)
// and only ever decrypted here, server-side — like lib/issue-providers.ts, this
// module uses raw fetch (no SDK dependency) so the endpoint can be any
// Anthropic-compatible base URL and the Docker image stays lean.
//
// Every feature degrades cleanly when no key is configured: callers check
// `aiConfigured()` before offering AI actions, and the actions throw a friendly
// AiError otherwise.

const DEFAULT_ENDPOINT = "https://api.anthropic.com";
export const DEFAULT_AI_MODEL = "claude-sonnet-5"; // brief: default when Anthropic
const ANTHROPIC_VERSION = "2023-06-01";

export class AiError extends Error {}

export type AiConfigView = {
  configured: boolean;
  endpoint: string;
  model: string;
};

/** Public (no-secret) view of an org's AI config for settings + UI gating. */
export async function loadAiConfig(orgId: string): Promise<AiConfigView> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { aiEndpoint: true, aiModel: true, aiApiKeyEnc: true },
  });
  return {
    configured: !!org?.aiApiKeyEnc,
    endpoint: org?.aiEndpoint || DEFAULT_ENDPOINT,
    model: org?.aiModel || DEFAULT_AI_MODEL,
  };
}

export async function aiConfigured(orgId: string): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { aiApiKeyEnc: true },
  });
  return !!org?.aiApiKeyEnc;
}

/** Save config. A blank apiKey keeps the existing key; the endpoint/model are
 * always updated. Passing `clearKey` disables AI. */
export async function saveAiConfig(
  orgId: string,
  input: { endpoint?: string; model?: string; apiKey?: string; clearKey?: boolean }
): Promise<void> {
  const data: {
    aiEndpoint: string | null;
    aiModel: string | null;
    aiApiKeyEnc?: string | null;
  } = {
    aiEndpoint: input.endpoint?.trim() ? input.endpoint.trim().replace(/\/$/, "") : null,
    aiModel: input.model?.trim() || null,
  };
  if (input.clearKey) data.aiApiKeyEnc = null;
  else if (input.apiKey?.trim()) data.aiApiKeyEnc = encrypt(input.apiKey.trim());
  await db.organization.update({ where: { id: orgId }, data });
}

/** Resolve the org id for a user (AI config is org-scoped). */
export async function orgIdForUser(userId: string): Promise<string | null> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return u?.organizationId ?? null;
}

type MessagesResult = { content?: { type: string; text?: string }[] };

/** One Anthropic-compatible Messages call. Returns the concatenated text of
 * the response. Throws AiError with a user-safe message on any failure. */
async function callMessages(
  orgId: string,
  opts: { system: string; user: string; maxTokens?: number }
): Promise<string> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { aiEndpoint: true, aiModel: true, aiApiKeyEnc: true },
  });
  if (!org?.aiApiKeyEnc)
    throw new AiError("AI is not configured for this organization.");

  let apiKey: string;
  try {
    apiKey = decrypt(org.aiApiKeyEnc);
  } catch {
    throw new AiError("Stored AI key could not be read — re-save it in Settings.");
  }

  const base = (org.aiEndpoint || DEFAULT_ENDPOINT).replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: org.aiModel || DEFAULT_AI_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
      signal: controller.signal,
    });
  } catch (e) {
    throw new AiError(
      (e as Error).name === "AbortError"
        ? "AI request timed out."
        : `Could not reach the AI endpoint: ${(e as Error).message}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Surface the provider's own error message when it's short and safe.
    const detail = body.slice(0, 300);
    throw new AiError(`AI request failed (HTTP ${res.status}). ${detail}`.trim());
  }

  const data = (await res.json().catch(() => null)) as MessagesResult | null;
  const text = (data?.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n")
    .trim();
  if (!text) throw new AiError("AI returned an empty response.");
  return text;
}

/** Extract the first JSON array/object from a model response (tolerates ```json
 * fences and surrounding prose). */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new AiError("AI response was not valid JSON.");
  // Walk from the first bracket to its match to isolate the JSON payload.
  const open = candidate[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T;
        } catch {
          throw new AiError("AI response was not valid JSON.");
        }
      }
    }
  }
  throw new AiError("AI response was not valid JSON.");
}

export type DraftCase = {
  title: string;
  priority: string; // one of PRIORITIES; validated by the caller
  type: string; // one of CASE_TYPES; validated by the caller
  preconditions: string;
  steps: { action: string; expected: string }[];
  expectedResult: string;
};

/** Feature 1: draft test cases from a pasted requirement / PRD. */
export async function generateCasesFromText(
  orgId: string,
  requirement: string
): Promise<DraftCase[]> {
  const system =
    "You are a senior QA engineer. Given a product requirement or PRD excerpt, " +
    "propose concrete manual test cases that verify it, including edge cases and " +
    "negative paths. Respond with ONLY a JSON array (no prose, no code fences) of " +
    "objects with this exact shape: " +
    '{"title": string, "priority": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", ' +
    '"type": "FUNCTIONAL"|"REGRESSION"|"SMOKE"|"PERFORMANCE"|"SECURITY"|"E2E", ' +
    '"preconditions": string, "steps": [{"action": string, "expected": string}], ' +
    '"expectedResult": string}. Keep each title under 120 characters. ' +
    "Return between 1 and 12 cases.";
  const text = await callMessages(orgId, {
    system,
    user: `Requirement:\n\n${requirement.slice(0, 12000)}`,
    maxTokens: 4096,
  });
  const raw = extractJson<unknown>(text);
  if (!Array.isArray(raw)) throw new AiError("AI did not return a list of cases.");
  return raw.slice(0, 12).map((c) => {
    const o = (c ?? {}) as Record<string, unknown>;
    const steps = Array.isArray(o.steps) ? o.steps : [];
    return {
      title: String(o.title ?? "").trim().slice(0, 200) || "Untitled case",
      priority: String(o.priority ?? "MEDIUM").toUpperCase(),
      type: String(o.type ?? "FUNCTIONAL").toUpperCase(),
      preconditions: String(o.preconditions ?? "").trim(),
      steps: steps
        .map((s) => {
          const so = (s ?? {}) as Record<string, unknown>;
          return {
            action: String(so.action ?? "").trim(),
            expected: String(so.expected ?? "").trim(),
          };
        })
        .filter((s) => s.action),
      expectedResult: String(o.expectedResult ?? "").trim(),
    };
  });
}

/** Feature 2: suggest additional edge-case steps for an existing case. */
export async function suggestEdgeSteps(
  orgId: string,
  testCase: { title: string; steps: { action: string; expected: string }[] }
): Promise<{ action: string; expected: string }[]> {
  const system =
    "You are a senior QA engineer reviewing a manual test case. Suggest ADDITIONAL " +
    "edge-case and negative-path steps that the case is missing — do not repeat " +
    "steps it already has. Respond with ONLY a JSON array of " +
    '{"action": string, "expected": string} objects (at most 8). If nothing is ' +
    "missing, return [].";
  const existing = testCase.steps
    .map((s, i) => `${i + 1}. ${s.action} -> ${s.expected}`)
    .join("\n");
  const text = await callMessages(orgId, {
    system,
    user: `Title: ${testCase.title}\n\nExisting steps:\n${existing || "(none)"}`,
    maxTokens: 2048,
  });
  const raw = extractJson<unknown>(text);
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 8)
    .map((s) => {
      const so = (s ?? {}) as Record<string, unknown>;
      return {
        action: String(so.action ?? "").trim(),
        expected: String(so.expected ?? "").trim(),
      };
    })
    .filter((s) => s.action);
}
