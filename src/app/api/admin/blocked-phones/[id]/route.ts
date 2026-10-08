import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";

// DELETE /api/admin/blocked-phones/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "orders")) {
    return NextResponse.json({ error: "You do not have permission." }, { status: 403 });
  }
  const { id } = await ctx.params;
  await db.blockedPhone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PUT /api/admin/blocked-phones/[id] — toggle active
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;
  const { active } = (await req.json()) as { active?: boolean };
  const phone = await db.blockedPhone.update({ where: { id }, data: { active: Boolean(active) } });
  return NextResponse.json({ phone });
}
