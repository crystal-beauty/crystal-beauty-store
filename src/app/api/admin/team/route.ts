import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, hashPassword } from "@/lib/auth";

// Team management — OWNER only (delete), ADMIN can view/list
export async function GET() {
  const guard = await requireApiSession("overview");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const team = await db.teamMember.findMany({
    select: { id: true, email: true, name: true, role: true, avatarUrl: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ team });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("team");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const role = ["OWNER", "ADMIN", "STAFF"].includes(body.role) ? body.role : "STAFF";

    if (!email || !name || password.length < 6) {
      return NextResponse.json({ error: "Name, email and a password of at least 6 characters are required." }, { status: 400 });
    }
    if (role === "OWNER" && guard.session.role !== "OWNER") {
      return NextResponse.json({ error: "Only an Owner can create another Owner." }, { status: 403 });
    }
    const exists = await db.teamMember.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "This email is already registered." }, { status: 400 });

    const member = await db.teamMember.create({
      data: { email, name, role, passwordHash: hashPassword(password), active: body.active !== false },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Could not create the team member." }, { status: 500 });
  }
}
