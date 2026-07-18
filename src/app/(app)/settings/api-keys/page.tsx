import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ApiKeyCreator } from "@/components/ApiKeyCreator";
import { DeleteApiKeyButton } from "@/components/DeleteApiKeyButton";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await requireSession();
  const [keys, memberships] = await Promise.all([
    db.apiKey.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
    // F-33: only projects the user belongs to can be chosen as a key's scope.
    db.projectMember.findMany({
      where: { userId: session.userId },
      select: { project: { select: { id: true, name: true } } },
      orderBy: { project: { name: "asc" } },
    }),
  ]);
  const projects = memberships.map((m) => m.project);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-slate-500">
          For CI/CD and REST API authentication. Keys are hashed in the database
          and shown only once when created.{" "}
          <a
            href="/docs/api"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            View API reference →
          </a>
        </p>
      </div>

      <ApiKeyCreator projects={projects} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Key</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Scope</th>
              <th className="px-5 py-3">Rate limit</th>
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
                <td className="px-5 py-3 text-xs">
                  {k.project ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                      {k.project.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">All projects</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {k.rateLimitPerMin ? `${k.rateLimitPerMin}/min` : "Default"}
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
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
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
