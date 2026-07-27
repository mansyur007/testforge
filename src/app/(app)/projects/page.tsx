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
        <p className="text-sm text-content-muted">
          Multi-project workspace — each project has its own test namespace
        </p>
      </div>

      {session.role !== "VIEWER" && <NewProjectForm />}

      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase text-content-muted">
            <tr>
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Test Cases</th>
              <th className="px-5 py-3">Test Runs</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-subtle">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-canvas">
                <td className="px-5 py-3">
                  <Link
                    href={`/projects/${p.slug}`}
                    className="font-medium text-accent-text hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-content-subtle">/{p.slug}</p>
                </td>
                <td className="px-5 py-3">{p._count.cases}</td>
                <td className="px-5 py-3">{p._count.runs}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "ACTIVE"
                        ? "bg-success-soft text-success-soft-fg"
                        : "bg-surface-muted text-content-muted"
                    }`}
                  >
                    {p.status === "ACTIVE" ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <form action={archiveProject}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <button className="text-xs text-content-subtle hover:text-content">
                      {p.status === "ACTIVE" ? "Archive" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-content-subtle">
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
