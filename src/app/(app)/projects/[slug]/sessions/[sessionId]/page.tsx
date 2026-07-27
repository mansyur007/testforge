import Link from "next/link";
import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { caseDisplayId, SESSION_NOTE_BADGES, type SessionNoteKind } from "@/lib/constants";
import { ProjectTabs } from "@/components/ProjectTabs";
import { Markdown } from "@/components/Markdown";
import { SessionRunner } from "@/components/SessionRunner";
import { ConvertToIssueButton } from "@/components/ConvertToIssueButton";
import { endSession, convertNoteToCase } from "@/app/actions/sessions";
import { serializeAttachment } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: { slug: string; sessionId: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const s = await db.session.findFirst({
    where: { id: params.sessionId, projectId: project.id },
    include: {
      tester: { select: { name: true } },
      notes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!s) notFound();

  const isTester = s.testerId === session.userId;
  const hasIntegration =
    (await db.integration.count({ where: { projectId: project.id, active: true } })) > 0;

  const noteIds = s.notes.map((n) => n.id);
  const attachmentsByNote = new Map<string, ReturnType<typeof serializeAttachment>[]>();
  if (noteIds.length > 0) {
    const attachments = await db.attachment.findMany({
      where: { entityType: "SESSION_NOTE", entityId: { in: noteIds } },
      orderBy: { createdAt: "asc" },
    });
    for (const a of attachments) {
      const list = attachmentsByNote.get(a.entityId) ?? [];
      list.push(serializeAttachment(a));
      attachmentsByNote.set(a.entityId, list);
    }
  }

  // Convertible cases need their display id — batch-resolve.
  const convertedCaseIds = s.notes
    .filter((n) => n.convertedType === "CASE" && n.convertedId)
    .map((n) => n.convertedId!) as string[];
  const convertedCases = convertedCaseIds.length
    ? await db.testCase.findMany({
        where: { id: { in: convertedCaseIds } },
        select: { id: true, seq: true },
      })
    : [];
  const caseDisplayById = new Map(convertedCases.map((c) => [c.id, caseDisplayId(project.slug, c.seq)]));

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="sessions" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <BackLink href={`/projects/${project.slug}/sessions`}>Sessions</BackLink>
          <h2 className="mt-1 text-xl font-bold">{s.charter}</h2>
          <p className="mt-1 text-sm text-content-muted">
            Tester: <b>{s.tester.name}</b> ·{" "}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                s.status === "ACTIVE" ? "bg-success-soft text-success-soft-fg" : "bg-surface-muted text-content-muted"
              }`}
            >
              {s.status}
            </span>
          </p>
        </div>
        {isTester && s.status === "ACTIVE" && (
          <form action={endSession}>
            <input type="hidden" name="sessionId" value={s.id} />
            <button
              className="shrink-0 rounded-lg border border-hairline-strong px-3 py-1.5 text-sm hover:bg-surface-muted"
              data-testid="session-end-button"
            >
              End session
            </button>
          </form>
        )}
      </div>

      {isTester && s.status === "ACTIVE" && (
        <SessionRunner
          sessionId={s.id}
          startedAt={s.startedAt.toISOString()}
          timeboxMinutes={s.timeboxMinutes}
        />
      )}

      <section className="rounded-xl border border-hairline bg-surface p-5">
        <h3 className="mb-3 font-semibold">
          {s.status === "ENDED" ? "Session summary" : "Notes"} ({s.notes.length})
        </h3>
        <ul className="space-y-3" data-testid="session-notes-list">
          {s.notes.map((n) => {
            const kind = n.kind as SessionNoteKind;
            const noteAttachments = attachmentsByNote.get(n.id) ?? [];
            return (
              <li
                key={n.id}
                className="rounded-lg border border-hairline-subtle p-3"
                data-testid={`session-note-${n.id}`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_NOTE_BADGES[kind] ?? SESSION_NOTE_BADGES.NOTE}`}
                  >
                    {kind}
                  </span>
                  <span className="text-xs text-content-subtle">
                    {n.createdAt.toLocaleTimeString()}
                  </span>
                </div>
                <Markdown>{n.bodyMd}</Markdown>
                {noteAttachments.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {noteAttachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.url}
                          className="text-xs text-accent-text hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎 {a.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {n.convertedType === "CASE" && n.convertedId && (
                  <p className="mt-2 text-xs text-success-soft-fg">
                    → Converted to draft case{" "}
                    <Link
                      href={`/projects/${project.slug}/cases/${n.convertedId}`}
                      className="font-medium hover:underline"
                    >
                      {caseDisplayById.get(n.convertedId) ?? n.convertedId}
                    </Link>
                  </p>
                )}
                {n.convertedType === "ISSUE" && n.convertedId && (
                  <p className="mt-2 text-xs text-success-soft-fg">
                    → Filed as issue <b>{n.convertedId}</b>
                  </p>
                )}

                {isTester && !n.convertedType && (
                  <div className="mt-2 flex justify-end gap-2">
                    {kind === "IDEA" && (
                      <form action={convertNoteToCase}>
                        <input type="hidden" name="noteId" value={n.id} />
                        <button
                          className="rounded-lg border border-accent-ring px-2.5 py-1 text-xs font-medium text-accent-soft-fg hover:bg-accent-soft"
                          data-testid="session-note-convert-case"
                        >
                          Convert to draft case
                        </button>
                      </form>
                    )}
                    {kind === "BUG" && hasIntegration && (
                      <ConvertToIssueButton noteId={n.id} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {s.notes.length === 0 && (
            <li className="text-sm text-content-subtle">No notes yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
