import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError } from "@/lib/api";
import { evaluateGate, parseGatePolicy } from "@/lib/gate";

// L-02: CI quality gate verdict. Read scope — gates are consumed by CI,
// which should hold read keys. HTTP 200 whether passing or failing (the
// `pass` field decides; non-200 is reserved for real errors).

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const project = await db.project.findFirst({
    where: { slug: params.slug, members: { some: { userId: g.userId } } },
    select: { id: true, gatePolicyJson: true },
  });
  if (!project) return notFoundError("Project not found");
  if (!project.gatePolicyJson)
    return notFoundError("No gate policy configured");
  // Stored policies were validated on save; a parse failure here is a real
  // error and deserves the 500, not a silent green.
  const policy = parseGatePolicy(project.gatePolicyJson);

  const runParam = req.nextUrl.searchParams.get("run") ?? "latest";
  let runId: string;
  if (runParam === "latest") {
    // Newest by createdAt regardless of status — the CLI's --wait handles
    // incompleteness; the response's run.status says what was evaluated.
    const latest = await db.testRun.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!latest) return notFoundError("Run not found");
    runId = latest.id;
  } else {
    runId = runParam;
  }

  const verdict = await evaluateGate(project.id, runId, policy);
  if (!verdict) return notFoundError("Run not found");
  return NextResponse.json(verdict);
}
