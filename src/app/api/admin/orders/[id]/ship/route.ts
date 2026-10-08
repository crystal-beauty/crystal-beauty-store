import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { createParcel } from "@/lib/carrier";

/**
 * POST /api/admin/orders/[id]/ship — create the COD parcel at World Express (EcoTrack).
 *
 * Duplicate-safety:
 *  1. If the order already has a trackingNumber → return it, never book twice.
 *  2. A "pending" marker is saved BEFORE the API call, so if the process dies
 *     mid-call the admin sees the marker instead of silently re-booking.
 *  3. `reference` sent to the carrier is the unique order number.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // ---- idempotency guard ----
  if (order.trackingNumber) {
    return NextResponse.json({
      ok: true,
      alreadyBooked: true,
      trackingNumber: order.trackingNumber,
      order,
      message: "Parcel already created for this order — returning the existing tracking number.",
    });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot send a cancelled order to the carrier." }, { status: 400 });
  }
  if (!order.wilayaId || !order.commune) {
    return NextResponse.json({ error: "Order is missing wilaya/commune data." }, { status: 400 });
  }
  if (order.address.length > 30) {
    return NextResponse.json({ error: `Address is ${order.address.length} chars — the waybill printer accepts 30 max. Edit the order address first.` }, { status: 400 });
  }

  // ---- crash-safety marker ----
  await db.order.update({
    where: { id },
    data: {
      carrier: "World Express",
      shipmentResponse: JSON.stringify({ pending: true, at: new Date().toISOString(), by: guard.session.email }).slice(0, 5000),
    },
  });

  try {
    const productsLabel = order.items
      .map((i) => `${i.productName}${i.giftBox ? " +gift box" : ""} x${i.quantity}`)
      .join(", ")
      .slice(0, 200);

    const result = await createParcel({
      reference: order.orderNumber,
      customerName: order.recipientName?.trim() || order.customerName,
      phone: order.recipientPhone || order.phone,
      address: order.address,
      wilayaCode: order.wilayaId,
      commune: order.commune,
      codAmount: Math.round(order.total),
      deliveryType: order.deliveryType === "STOP_DESK" ? "STOP_DESK" : "HOME",
      productsLabel,
      note: order.notes || undefined,
    });

    const history = JSON.parse(order.statusHistory || "[]");
    history.push({ status: "SENT_TO_CARRIER", at: new Date().toISOString(), by: `carrier:${result.tracking}` });

    const updated = await db.order.update({
      where: { id },
      data: {
        carrier: "World Express",
        trackingNumber: result.tracking,
        carrierStatus: null,
        globalStatus: null,
        shipmentResponse: JSON.stringify({ request: { reference: order.orderNumber, montant: Math.round(order.total), commune: order.commune, code_wilaya: order.wilayaId, type: order.deliveryType }, response: result.raw }).slice(0, 5000),
        status: order.status === "NEW" ? "CONFIRMED" : order.status,
        statusHistory: JSON.stringify(history),
      },
      include: { items: true },
    });

    return NextResponse.json({ ok: true, trackingNumber: result.tracking, order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const updated = await db.order.update({
      where: { id },
      data: {
        shipmentResponse: JSON.stringify({ pending: false, error: msg, at: new Date().toISOString() }).slice(0, 5000),
      },
      include: { items: true },
    });
    return NextResponse.json(
      { error: `Carrier refused the parcel or is unreachable: ${msg}`, order: updated },
      { status: 502 }
    );
  }
}
