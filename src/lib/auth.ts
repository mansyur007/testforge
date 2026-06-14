import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "testforge-dev-secret"
);
const COOKIE = "tf_session";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

// PRD §12.6.1: "Remember me" = 30 hari, default 1 hari.
// AU-010 (refresh token rotation) masuk backlog — lihat AUDIT-PRD.md.
export async function createSession(
  user: { id: string; email: string; name: string; role: string },
  rememberMe = false
) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "30d" : "1d")
    .sign(SECRET);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Autentikasi request API via Bearer API key (untuk CI/CD, PRD §5.3). */
export async function authenticateApiKey(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const crypto = await import("crypto");
  const keyHash = crypto.createHash("sha256").update(token).digest("hex");
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });
  if (!apiKey) return null;

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });
  return apiKey.user;
}
