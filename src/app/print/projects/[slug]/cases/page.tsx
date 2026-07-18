import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { formatDuration } from "@/lib/duration";
import { Markdown } from "@/components/Markdown";
import { GherkinBlock } from "@/components/GherkinBlock";
import { PrintToolbar } from "@/components/PrintToolbar";
import { loadCaseCatalog, type PrintCase } from "@/lib/case-doc";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CaseSection({ c }: { c: PrintCase }) {
  const meta: React.ReactNode[] = [];
  meta.push(
    <span key="type" className="tf-chip">
      {c.type}
    </span>
  );
  meta.push(
    <span key="status" className="tf-secondary">
      {c.status.replace(/_/g, " ")}
    </span>
  );
  if (c.assigneeName)
    meta.push(<span key="assignee">Assignee: {c.assigneeName}</span>);
  if (c.estimateSeconds != null)
    meta.push(<span key="est">Estimate: {formatDuration(c.estimateSeconds)}</span>);
  if (c.tags.length > 0) meta.push(<span key="tags">Tags: {c.tags.join(", ")}</span>);
  if (c.requirements.length > 0)
    meta.push(
      <span key="reqs">
        Requirements: {c.requirements.map((r) => r.refId).join(", ")}
      </span>
    );

  return (
    <section
      className={`tf-print-case ${c.long ? "tf-long" : ""}`}
      data-testid={`print-case-${c.displayId}`}
    >
      <div className="tf-case-head">
        <div>
          <span className="tf-mono tf-secondary">{c.displayId}</span>{" "}
          <span className="tf-case-title">{c.title}</span>
        </div>
        <span className="tf-chip">{c.priority}</span>
      </div>

      <div
        className="tf-secondary"
        style={{ display: "flex", flexWrap: "wrap", gap: "1mm 3mm", margin: "1mm 0", fontSize: "9pt", alignItems: "baseline" }}
      >
        {meta}
      </div>

      {c.preconditions.trim() && (
        <div style={{ margin: "2mm 0" }}>
          <div className="tf-meta-label">Preconditions</div>
          <Markdown>{c.preconditions}</Markdown>
        </div>
      )}

      {c.isGherkin && c.gherkin ? (
        <GherkinBlock text={c.gherkin} />
      ) : c.steps.length > 0 ? (
        <table className="tf-steps">
          <thead>
            <tr>
              <th className="tf-step-num">#</th>
              <th>Action</th>
              <th>Expected</th>
            </tr>
          </thead>
          <tbody>
            {c.steps.map((s, i) => (
              <tr key={i}>
                <td className="tf-step-num">{i + 1}</td>
                <td>
                  {s.fromShared && (
                    <div
                      className="tf-shared-origin"
                      data-testid="print-shared-origin"
                    >
                      ⛓ {s.fromShared.title}
                    </div>
                  )}
                  <Markdown>{s.action}</Markdown>
                </td>
                <td>{s.expected ? <Markdown>{s.expected}</Markdown> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {c.expectedResult.trim() && (
        <div className="tf-expected">
          <div className="tf-meta-label">Expected result</div>
          <Markdown>{c.expectedResult}</Markdown>
        </div>
      )}

      {c.customFields.length > 0 && (
        <dl className="tf-fields">
          {c.customFields.map((f, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>
                {f.label}
                {!f.active && <span className="tf-secondary"> (disabled)</span>}
              </dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {c.attachments.length > 0 && (
        <div style={{ margin: "2mm 0" }}>
          <div className="tf-meta-label">Attachments</div>
          <ul className="tf-attach-list">
            {c.attachments.map((a) => (
              <li key={a.id}>
                {a.filename} · {formatBytes(a.sizeBytes)}
                {a.isImage && (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/attachments/${a.id}`} alt={a.filename} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default async function PrintCasesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { suite?: string; view?: string; case?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    select: { id: true, slug: true, name: true },
  });
  if (!project) notFound();

  const catalog = await loadCaseCatalog(project, {
    suiteId: searchParams.suite,
    viewId: searchParams.view,
    caseId: searchParams.case,
  });

  const now = new Date();
  const generated = `${now.toISOString().slice(0, 10)} ${now
    .toTimeString()
    .slice(0, 5)}`;
  const pdfTitle = `${project.slug} — ${
    catalog.singleCase ? "case" : "case-catalog"
  } — TestForge`;

  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "";
  const qs = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v) as [string, string][]
  ).toString();
  const absoluteUrl = `${proto}://${host}/print/projects/${project.slug}/cases${
    qs ? `?${qs}` : ""
  }`;

  return (
    <div className="tf-print-page">
      <PrintToolbar title={pdfTitle} />

      {/* Cover — collapses to a slim header for a single-case document. */}
      {catalog.singleCase ? (
        <header
          className="tf-print-cover"
          data-testid="print-cover"
          style={{ breakAfter: "auto", marginBottom: "6mm" }}
        >
          <h1 style={{ fontSize: "15pt" }}>{project.name} — Test Case</h1>
          <p className="tf-secondary tf-mono" style={{ fontSize: "9pt" }}>
            generated {generated} · by {session.name}
          </p>
          <hr className="tf-rule" style={{ margin: "3mm 0" }} />
        </header>
      ) : (
        <header className="tf-print-cover" data-testid="print-cover">
          <h1>{project.name} — Test Case Catalog</h1>
          <hr className="tf-rule" />
          <p className="tf-secondary">
            {catalog.totalCases} case{catalog.totalCases === 1 ? "" : "s"} ·{" "}
            {catalog.suiteCount} suite{catalog.suiteCount === 1 ? "" : "s"} ·
            generated {generated} · by {session.name}
          </p>
          {catalog.scope && (
            <div className="tf-scope-box" data-testid="print-scope">
              <div className="tf-meta-label">Scope</div>
              <div>{catalog.scope.label}</div>
              {catalog.scope.chips.length > 0 && (
                <div className="tf-secondary" style={{ fontSize: "9pt", marginTop: "1mm" }}>
                  {catalog.scope.chips.join(" · ")}
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {/* TOC — flat suite list in tree order, clickable in the exported PDF. */}
      {!catalog.singleCase && catalog.suites.length > 0 && (
        <nav data-testid="print-toc" style={{ marginBottom: "6mm" }}>
          <h2>Contents</h2>
          <ul className="tf-toc">
            {catalog.suites.map((s) => (
              <li key={s.id}>
                <a href={`#suite-${s.id}`}>{s.path}</a>
                <span className="tf-count">
                  {s.cases.length} case{s.cases.length === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Body */}
      {catalog.suites.length === 0 ? (
        <p className="tf-secondary" data-testid="print-empty">
          No cases match this document&apos;s scope.
        </p>
      ) : (
        catalog.suites.map((s) => (
          <div key={s.id} className="tf-print-suite">
            {!catalog.singleCase && <h2 id={`suite-${s.id}`}>{s.path}</h2>}
            {s.cases.map((c) => (
              <CaseSection key={c.id} c={c} />
            ))}
          </div>
        ))
      )}

      <footer className="tf-doc-footer" data-testid="print-footer">
        Generated by TestForge — {absoluteUrl}
      </footer>
    </div>
  );
}
