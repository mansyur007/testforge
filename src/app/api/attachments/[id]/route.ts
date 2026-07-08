import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, notFoundError } from "@/lib/api";
import { getStorage } from "@/lib/storage";
import { INLINE_IMAGE_MIMES, headerFilename } from "@/lib/attachments";

// F-01: download/view an attachment. Session or Bearer API key; the requester
// must be a member of the attachment's project — non-members get 404 (not 403)
// so attachment ids can't be probed for existence.
//
// Serving rules (stored-XSS defense): only safe raster images render inline;
// everything else — including SVG and HTML — is forced to download as an
// octet-stream, always with nosniff.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const attachment = await db.attachment.findFirst({
    where: {
      id: params.id,
      project: { members: { some: { userId: g.userId } } },
    },
  });
  if (!attachment) return notFoundError("Attachment not found");

  let data: Buffer;
  try {
    data = await getStorage().get(attachment.storageKey);
  } catch {
    return notFoundError("Attachment file is missing");
  }

  const inline = INLINE_IMAGE_MIMES.includes(attachment.mimeType);
  const name = headerFilename(attachment.filename);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": inline ? attachment.mimeType : "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Content-Length": String(data.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
