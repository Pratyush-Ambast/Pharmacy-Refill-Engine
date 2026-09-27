import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { encodeSession, setSession, verifyPassword, hashPassword } from "@/lib/auth";

const DEMO_USERS = [
  { name: "Alex Morgan", email: "staff@demo.local", role: "staff", password: "StaffDemo!2026" },
  { name: "Dr. Jordan Lee", email: "provider@demo.local", role: "provider", password: "ProviderDemo!2026" },
] as const;

async function ensureAuthUsers() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Hackathon demo accounts are provisioned automatically so login does not
  // depend on whether the older database seed was run before auth was added.
  for (const user of DEMO_USERS) {
    const existing = await sql`SELECT id FROM users WHERE lower(email)=lower(${user.email}) LIMIT 1`;
    if (!existing.length) {
      await sql`
        INSERT INTO users(name,email,role,password_hash,active)
        VALUES(${user.name},${user.email},${user.role},${hashPassword(user.password)},true)
      `;
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await ensureAuthUsers();
    const sql = getSql();
    const rows = await sql`
      SELECT id,name,email,role,password_hash,active
      FROM users
      WHERE lower(email)=lower(${email})
      LIMIT 1
    `;
    const user = rows[0];

    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let valid = false;
    try {
      valid = verifyPassword(password, String(user.password_hash));
    } catch {
      valid = false;
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    setSession(encodeSession({
      id: Number(user.id),
      name: String(user.name),
      email: String(user.email),
      role: user.role,
    }));

    return NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error("[auth/login]", error);
    return NextResponse.json({
      error: error?.message || "Authentication service unavailable",
    }, { status: 500 });
  }
}
