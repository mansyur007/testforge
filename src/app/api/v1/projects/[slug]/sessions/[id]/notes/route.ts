import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  guard,
  notFoundError,
  forbidden,
  validationError,
  type FieldError,
  serializeSessionNote,
} from "@/lib/api";
import { SESSION_NOTE_KINDS } from "@/lib/constants";

// F-25: notes dropped during a live session.

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const session = await db.session.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
    select: { id: true },
  });
  if (!session) return notFoundError("Session not found");

  const notes = await db.sessionNote.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items: notes.map(serializeSessionNote) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const g = await guard(req, { write: true });
  if (g instanceof NextResponse) return g;

  const session = await db.session.findFirst({
    where: {
      id: params.id,
      project: { slug: params.slug, members: { some: { userId: g.userId } } },
    },
  });
  if (!session) return notFoundError("Session not found");
  if (session.testerId !== g.userId)
    return forbidden("Only the tester who started this session may add notes.");
  if (session.status !== "ACTIVE")
    return forbidden("This session has already ended.");

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return validationError([{ field: "body", message: "Invalid JSON body" }]);

  const errors: FieldError[] = [];
  const kind = String(body.kind ?? "NOTE").toUpperCase();
  if (!(SESSION_NOTE_KINDS as readonly string[]).includes(kind))
    errors.push({ field: "kind", message: "kind must be one of NOTE, BUG, QUESTION, IDEA" });
  const bodyMd = String(body.bodyMd ?? "").trim();
  if (!bodyMd) errors.push({ field: "bodyMd", message: "bodyMd is required" });
  if (errors.length) return validationError(errors);

  const note = await db.sessionNote.create({
    data: { sessionId: session.id, kind, bodyMd },
  });
  await logAudit({
    userId: g.userId,
    action: "session.note_add",
    entityType: "session_note",
    entityId: note.id,
  });

  return NextResponse.json(serializeSessionNote(note), { status: 201 });
}
