import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";

// PUT /api/admin/reviews/[id] — approve / hide / edit text
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.approved === "boolean") data.approved = body.approved;
  if (typeof body.text === "string") data.text = body.text.slice(0, 2000);
  if (typeof body.rating === "number") data.rating = Math.max(1, Math.min(5, Math.round(body.rating)));

  const review = await db.review.update({ where: { id }, data });
  return NextResponse.json({ review });
}

// DELETE /api/admin/reviews/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "orders")) {
    return NextResponse.json({ error: "You do not have permission to delete reviews." }, { status: 403 });
  }
  const { id } = await ctx.params;
  await db.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
