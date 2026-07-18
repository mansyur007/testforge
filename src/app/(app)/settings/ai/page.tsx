import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { loadAiConfig, DEFAULT_AI_MODEL } from "@/lib/ai";
import { AiSettingsForm } from "@/components/AiSettingsForm";

export const dynamic = "force-dynamic";

// F-29: org-level AI assist configuration (Anthropic-compatible endpoint + key).
export default async function AiSettingsPage() {
  const session = await requireSession();
  const me = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { organizationId: true, role: true },
  });
  const isAdmin = me.role === "ADMIN";
  const config = me.organizationId
    ? await loadAiConfig(me.organizationId)
    : { configured: false, endpoint: "", model: DEFAULT_AI_MODEL };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI assist</h1>
        <p className="text-sm text-slate-500">
          Bring your own key for an Anthropic-compatible endpoint. AI features
          (draft cases from a requirement, suggest edge-case steps) are opt-in
          per click and stay off until a key is saved. The key is stored
          encrypted and never shown again.
        </p>
      </div>

      {!isAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {config.configured
            ? "AI assist is configured for your organization."
            : "AI assist is not configured."}{" "}
          Only organization admins can change these settings.
        </div>
      ) : (
        <AiSettingsForm
          configured={config.configured}
          endpoint={config.endpoint}
          model={config.model}
          defaultModel={DEFAULT_AI_MODEL}
        />
      )}
    </div>
  );
}
