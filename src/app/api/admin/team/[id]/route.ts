import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, hashPassword, canDelete } from "@/lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("team");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const target = await db.teamMember.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name?.trim()) data.name = String(body.name).trim();
    if (body.role && ["OWNER", "ADMIN", "STAFF"].includes(body.role)) {
      if (body.role === "OWNER" && guard.session.role !== "OWNER") {
        return NextResponse.json({ error: "Only an Owner can assign the Owner role." }, { status: 403 });
      }
      if (target.role === "OWNER" && body.role !== "OWNER" && target.id === guard.session.id) {
        return NextResponse.json({ error: "You cannot demote yourself from Owner." }, { status: 400 });
      }
      data.role = body.role;
    }
    if ("active" in body) {
      if (target.id === guard.session.id && body.active === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
      }
      data.active = Boolean(body.active);
    }
    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      data.passwordHash = hashPassword(String(body.password));
    }

    const member = await db.teamMember.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Could not update the team member." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("team");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "team")) {
    return NextResponse.json({ error: "Only the store Owner can remove team members." }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === guard.session.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  try {
    const target = await db.teamMember.findUnique({ where: { id } });
    if (target?.role === "OWNER") {
      const owners = await db.teamMember.count({ where: { role: "OWNER", active: true } });
      if (owners <= 1) return NextResponse.json({ error: "Cannot delete the only Owner." }, { status: 400 });
    }
    await db.teamMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the team member." }, { status: 500 });
  }
}
