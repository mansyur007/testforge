"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

// Autentikasi sepenuhnya via OAuth (lihat src/app/api/auth/oauth/[provider]).
// Tidak ada lagi flow email/password — hanya logout yang ditangani di sini.
export async function logout() {
  clearSession();
  redirect("/login");
}
