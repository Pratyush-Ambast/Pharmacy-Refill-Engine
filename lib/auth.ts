import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type UserRole = "staff" | "provider";
export type SessionUser = { id: number; name: string; email: string; role: UserRole };
const COOKIE = "refill_session";
const secret = () => process.env.AUTH_SECRET || "dev-only-change-me";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function decodeSession(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp < Date.now() || !["staff", "provider"].includes(data.role)) return null;
    return { id: Number(data.id), name: String(data.name), email: String(data.email), role: data.role };
  } catch { return null; }
}
export function setSession(token: string) {
  cookies().set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}
export function clearSession() { cookies().set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
export function getSession(): SessionUser | null {
  const token = cookies().get(COOKIE)?.value;
  return token ? decodeSession(token) : null;
}
export function requireRole(role?: UserRole) {
  const user = getSession();
  if (!user) throw new Error("AUTH_REQUIRED");
  if (role && user.role !== role) throw new Error("FORBIDDEN");
  return user;
}
