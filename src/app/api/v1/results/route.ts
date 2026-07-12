import { NextRequest, NextResponse } from "next/server";
import { guard, badRequest, notFoundError, validationError, serializeRun, requirePerm } from "@/lib/api";
import { db } from "@/lib/db";
import {
  detectFormat,
  parseResults,
  ResultParseError,
  RESULT_FORMATS,
  type ResultFormat,
} from "@/lib/result-parsers";
import { ingestResults } from "@/lib/result-ingest";

// F-11: framework-agnostic result upload, superset of /api/v1/junit. Accepts
// `format` explicitly or auto-detects it from the body (JSON shape / XML root
// element). /api/v1/junit remains a permanent alias of format=junit.
export async function POST(req: NextRequest) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const sp = req.nextUrl.searchParams;
  const slug = sp.get("project") ?? "";
  if (!slug) return badRequest("project query param is required");

  const runName = sp.get("name") ?? `Automation Run ${new Date().toISOString()}`;
  const origin = sp.get("origin")?.slice(0, 120) || null;
  const env = sp.get("env"); // F-19
  const formatParam = sp.get("format")?.toLowerCase();

  if (formatParam && !RESULT_FORMATS.includes(formatParam as ResultFormat))
    return validationError([
      { field: "format", message: `must be one of: ${RESULT_FORMATS.join(", ")}` },
    ]);

  const body = await req.text();

  let format: ResultFormat;
  let normalized;
  try {
    format = (formatParam as ResultFormat) ?? detectFormat(body);
    normalized = parseResults(format, body);
  } catch (err) {
    const message = err instanceof ResultParseError ? err.message : "Could not parse the uploaded file";
    return validationError([{ field: "body", message }]);
  }

  const source = sp.get("source")?.toUpperCase() ?? format.toUpperCase();

  // F-14: an upload creates a run plus its results — run.manage. Resolve the
  // project just for the check; ingestResults re-resolves for its own 404.
  const uploadProject = await db.project.findFirst({
    where: { slug, members: { some: { userId: g.userId } } },
    select: { id: true },
  });
  if (uploadProject) {
    const denied = await requirePerm(g.userId, uploadProject.id, "run.manage");
    if (denied) return denied;
  }

  const outcome = await ingestResults(normalized, {
    projectSlug: slug,
    userId: g.userId,
    runName,
    source,
    origin,
    env,
  });

  if (!outcome.ok) {
    if (outcome.status === 404) return notFoundError(outcome.error);
    if (outcome.status === 400) return badRequest(outcome.error);
    return validationError([
      { field: "match", message: outcome.error },
      ...(outcome.unmatched ?? []).map((name) => ({ field: "test", message: name })),
    ]);
  }

  return NextResponse.json(
    {
      ...serializeRun(outcome.run, outcome.summary),
      runUrl: `/projects/${slug}/runs/${outcome.run.id}`,
      matched: outcome.matched,
      automated: outcome.automated,
      unmatched: outcome.unmatched,
    },
    { status: 201 }
  );
}
