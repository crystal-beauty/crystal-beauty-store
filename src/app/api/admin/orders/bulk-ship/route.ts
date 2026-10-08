import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { createParcel } from "@/lib/carrier";

/**
 * POST /api/admin/orders/bulk-ship  { ids: string[] }
 * Sends each order to World Express. Orders that already have a tracking
 * number are skipped (never booked twice). Returns per-order results.
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { ids } = (await req.json()) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No orders selected." }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: "Maximum 50 orders per batch." }, { status: 400 });
  }

  const orders = await db.order.findMany({ where: { id: { in: ids } }, include: { items: true } });
  const results: { id: string; orderNumber: string; ok: boolean; trackingNumber?: string; error?: string }[] = [];

  for (const order of orders) {
    if (order.trackingNumber) {
      results.push({ id: order.id, orderNumber: order.orderNumber, ok: true, trackingNumber: order.trackingNumber });
      continue;
    }
    if (!order.wilayaId || !order.commune || order.address.length > 30) {
      results.push({ id: order.id, orderNumber: order.orderNumber, ok: false, error: "Invalid address / wilaya data" });
      continue;
    }

    // crash-safety marker
    await db.order.update({
      where: { id: order.id },
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

      await db.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: result.tracking,
          shipmentResponse: JSON.stringify({ response: result.raw }).slice(0, 5000),
          status: order.status === "NEW" ? "CONFIRMED" : order.status,
          statusHistory: JSON.stringify(history),
        },
      });
      results.push({ id: order.id, orderNumber: order.orderNumber, ok: true, trackingNumber: result.tracking });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await db.order.update({
        where: { id: order.id },
        data: { shipmentResponse: JSON.stringify({ pending: false, error: msg, at: new Date().toISOString() }).slice(0, 5000) },
      });
      results.push({ id: order.id, orderNumber: order.orderNumber, ok: false, error: msg });
    }
  }

  return NextResponse.json({ results });
}
