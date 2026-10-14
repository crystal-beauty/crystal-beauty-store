import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/format";
import { deleteOrderAtomic } from "@/lib/inventory";

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
      const current = await db.order.findUnique({ where: { id }, select: { status: true, statusHistory: true } });
      if (current && current.status !== body.status) {
        const history = JSON.parse(current.statusHistory || "[]");
        history.push({ status: body.status, at: new Date().toISOString(), by: guard.session.email });
        data.status = body.status;
        data.statusHistory = JSON.stringify(history);
      }
      if (body.status === "SENT_TO_CARRIER") data.sentToCarrierAt = new Date();
      if (body.status === "DELIVERED") data.deliveredAt = new Date();
    }
    if ("notes" in body) data.notes = body.notes?.trim() || null;

    const order = await db.order.update({ where: { id }, data, include: { items: true } });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
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
