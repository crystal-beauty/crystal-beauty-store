import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/format";

// GET /api/admin/orders/[id]
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

// PUT /api/admin/orders/[id] — update status / tracking / internal fields
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
      data.status = body.status;
      if (body.status === "SHIPPED") data.shippedAt = new Date();
      if (body.status === "DELIVERED") data.deliveredAt = new Date();
    }
    if ("trackingNumber" in body) data.trackingNumber = body.trackingNumber?.trim() || null;
    if ("carrier" in body) data.carrier = body.carrier?.trim() || null;
    if ("shipmentStatus" in body) data.shipmentStatus = body.shipmentStatus?.trim() || null;
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
    await db.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the order." }, { status: 500 });
  }
}
