import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
export { hashPassword } from "@/lib/auth-core";

const SECRET = process.env.AUTH_SECRET || "lumina-gifts-secret-key-change-in-production";
export const SESSION_COOKIE = "lumina_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
};

export { verifyPasswordStandalone as verifyPasswordRaw } from "@/lib/auth-core";

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuf = Buffer.from(hash, "hex");
    const testBuf = crypto.scryptSync(password, salt, hashBuf.length);
    return crypto.timingSafeEqual(hashBuf, testBuf);
  } catch {
    return false;
  }
}

// ---------- Session token (HMAC signed) ----------
function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 }));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

// ---------- Cookie helpers ----------
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: false,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ---------- Session access ----------
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function authenticate(email: string, password: string): Promise<SessionPayload | null> {
  const member = await db.teamMember.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!member || !member.active) return null;
  if (!verifyPassword(password, member.passwordHash)) return null;
  await db.teamMember.update({ where: { id: member.id }, data: { lastLoginAt: new Date() } });
  return { id: member.id, email: member.email, name: member.name, role: member.role as SessionPayload["role"] };
}

// ---------- Role permissions ----------
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ["*"],
  ADMIN: ["overview", "products", "categories", "orders", "reviews", "blocked", "promo", "shipping", "pixel", "settings"],
  STAFF: ["overview", "orders", "reviews", "blocked"],
};

export function canAccess(role: string, section: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(section);
}

export function canDelete(role: string, section: string): boolean {
  if (role === "OWNER") return true;
  if (role === "ADMIN") return section !== "team";
  return false;
}

// ---------- API guard ----------
export async function requireApiSession(section: string): Promise<
  { ok: true; session: SessionPayload } | { ok: false; status: number; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401, error: "Not authenticated" };
  if (!canAccess(session.role, section)) return { ok: false, status: 403, error: "Insufficient permissions" };
  return { ok: true, session };
}
