import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { archiveProject } from "@/app/actions/projects";
import { memberScope } from "@/lib/projects";
import { NewProjectForm } from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await db.project.findMany({
    where: memberScope(session.userId),
    include: {
      _count: { select: { cases: true, runs: true, suites: true } },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-slate-500">
          Multi-project workspace — each project has its own test namespace
        </p>
      </div>

      {session.role !== "VIEWER" && <NewProjectForm />}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Test Cases</th>
              <th className="px-5 py-3">Test Runs</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link
                    href={`/projects/${p.slug}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-400">/{p.slug}</p>
                </td>
                <td className="px-5 py-3">{p._count.cases}</td>
                <td className="px-5 py-3">{p._count.runs}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status === "ACTIVE" ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <form action={archiveProject}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <button className="text-xs text-slate-400 hover:text-slate-700">
                      {p.status === "ACTIVE" ? "Archive" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No projects yet. Create your first project above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
