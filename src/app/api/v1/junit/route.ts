import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth";
import { parseJUnit } from "@/lib/result-parsers/junit";
import { ResultParseError } from "@/lib/result-parsers/types";
import { ingestResults } from "@/lib/result-ingest";

// Upload hasil automation framework-agnostic via JUnit XML (PRD §7.1 P1, US-010).
// Matching ke test case: anotasi TC-[SLUG]-[NUM] di nama test, atau exact title.
// Kept as a permanent alias of POST /api/v1/results?format=junit (F-11) —
// same auth (plain API key, no WRITE-scope check) and response shape as
// before, so existing CI integrations never break.
export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user)
    return NextResponse.json(
      { error: "Unauthorized — sertakan header Authorization: Bearer <API_KEY>" },
      { status: 401 }
    );

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const runName =
    req.nextUrl.searchParams.get("name") ??
    `Automation Run ${new Date().toISOString()}`;
  const source = (req.nextUrl.searchParams.get("source") ?? "JUNIT").toUpperCase();
  const origin = req.nextUrl.searchParams.get("origin")?.slice(0, 120) || null;
  const env = req.nextUrl.searchParams.get("env"); // F-19

  const xml = await req.text();
  let normalized;
  try {
    normalized = parseJUnit(xml);
  } catch (err) {
    const message = err instanceof ResultParseError ? err.message : "Invalid XML";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const outcome = await ingestResults(normalized, {
    projectSlug: slug,
    userId: user.id,
    runName,
    source,
    origin,
    env,
  });

  if (!outcome.ok) {
    if (outcome.status === 404)
      return NextResponse.json({ error: outcome.error }, { status: 404 });
    if (outcome.status === 400)
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    return NextResponse.json(
      { error: outcome.error, unmatched: outcome.unmatched },
      { status: 422 }
    );
  }

  return NextResponse.json({
    runId: outcome.run.id,
    runUrl: `/projects/${slug}/runs/${outcome.run.id}`,
    matched: outcome.matched,
    automated: outcome.automated,
    unmatched: outcome.unmatched,
    summary: outcome.summary,
  });
}
