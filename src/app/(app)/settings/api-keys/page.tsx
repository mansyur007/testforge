import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ApiKeyCreator } from "@/components/ApiKeyCreator";
import { DeleteApiKeyButton } from "@/components/DeleteApiKeyButton";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await requireSession();
  const keys = await db.apiKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-slate-500">
          For CI/CD and REST API authentication. Keys are hashed in the database
          and shown only once when created.
        </p>
      </div>

      <ApiKeyCreator />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Key</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Last Used</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="px-5 py-3 font-medium">{k.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">
                  {k.prefix}••••••••
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.scope === "READ"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {k.scope === "READ" ? "Read-only" : "Read & write"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {k.lastUsedAt
                    ? k.lastUsedAt.toLocaleString("en-US")
                    : "Never"}
                </td>
                <td className="px-5 py-3 text-right">
                  <DeleteApiKeyButton keyId={k.id} keyName={k.name} />
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  No API keys yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
