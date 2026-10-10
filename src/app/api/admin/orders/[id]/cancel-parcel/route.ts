import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { deleteParcel } from "@/lib/carrier";

/**
 * POST /api/admin/orders/[id]/cancel-parcel — delete the parcel at the carrier
 * (documented DELETE /api/v1/delete/order) and mark the order cancelled.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let carrierDeleted = false;
  let carrierError: string | null = null;
  if (order.trackingNumber) {
    try {
      carrierDeleted = await deleteParcel(order.trackingNumber);
      if (!carrierDeleted) carrierError = "Carrier did not confirm deletion";
    } catch (e) {
      carrierError = e instanceof Error ? e.message : "Carrier unreachable";
    }
  }

  const history = JSON.parse(order.statusHistory || "[]");
  history.push({ status: "CANCELLED", at: new Date().toISOString(), by: guard.session.email });

  const updated = await db.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
      statusHistory: JSON.stringify(history),
      ...(order.trackingNumber
        ? { shipmentResponse: JSON.stringify({ cancelAttempt: { ok: carrierDeleted, error: carrierError, at: new Date().toISOString() } }).slice(0, 5000) }
        : {}),
    },
    include: { items: true },
  });

  if (order.trackingNumber && !carrierDeleted) {
    return NextResponse.json(
      { error: `Order cancelled locally, but the carrier deletion failed: ${carrierError}. Delete it manually on the carrier portal.`, order: updated },
      { status: 207 }
    );
  }
  return NextResponse.json({ ok: true, order: updated });
}
