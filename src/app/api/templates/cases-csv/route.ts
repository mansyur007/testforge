import { NextResponse } from "next/server";

// Template CSV untuk import test case (US-004)
export async function GET() {
  const template = [
    "title,description,preconditions,steps,expected_result,priority,type,tags",
    '"Valid login dengan email terdaftar","Memastikan user bisa login","User sudah terdaftar","Buka halaman /login|Input email valid|Input password benar|Klik tombol Login","User diarahkan ke dashboard",HIGH,FUNCTIONAL,"smoke,login"',
    '"Login gagal dengan password salah","Validasi error handling","User sudah terdaftar","Buka halaman /login|Input email valid|Input password salah|Klik Login","Muncul pesan error, tidak ada session",MEDIUM,FUNCTIONAL,"login,negative"',
  ].join("\n");

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="testforge-template.csv"',
    },
  });
}
