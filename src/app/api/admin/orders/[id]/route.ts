import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/format";
import { deleteOrderAtomic, updateOrderStatusAtomic } from "@/lib/inventory";

// GET /api/admin/orders/[id]
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

// PUT /api/admin/orders/[id] — update status / notes
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.status) {
      if (!ORDER_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      const notes = "notes" in body ? (body.notes?.trim() || null) : undefined;
      const order = await updateOrderStatusAtomic(id, body.status, {
        by: guard.session.email,
        notes,
      });
      return NextResponse.json({ order });
    }

    if ("notes" in body) {
      const order = await db.order.update({
        where: { id },
        data: { notes: body.notes?.trim() || null },
        include: { items: true },
      });
      return NextResponse.json({ order });
    }

    const order = await db.order.findUnique({ where: { id }, include: { items: true } });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update the order." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "orders")) {
    return NextResponse.json({ error: "You do not have permission to delete orders." }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const result = await deleteOrderAtomic(id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Order deletion error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete the order." },
      { status: 500 }
    );
  }
}
