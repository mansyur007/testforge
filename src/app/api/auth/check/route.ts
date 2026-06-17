import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PRD §12.2.2: cek async ketersediaan email & slug org (dipanggil
// dengan debounce 500ms dari form signup).
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const slug = req.nextUrl.searchParams.get("slug");

  if (email) {
    const exists = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    return NextResponse.json({ available: !exists });
  }
  if (slug) {
    const exists = await db.organization.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });
    return NextResponse.json({ available: !exists });
  }
  return NextResponse.json({ error: "email or slug is required" }, { status: 400 });
}
