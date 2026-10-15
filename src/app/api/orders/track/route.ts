import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTracking, mapCarrierStatus } from "@/lib/carrier";
import { normalizeDzPhone, ORDER_STATUSES } from "@/lib/format";
import { rateLimit, phoneKey } from "@/lib/order-guard";
import { updateOrderStatusAtomic } from "@/lib/inventory";

// GET /api/orders/track?orderNumber=LG-XXXX&phone=0555...
// Customer tracks with phone + order number. If the order was sent to the
// carrier, the live status is fetched from the carrier API (and stored).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim().toUpperCase() || "";
    const phone = searchParams.get("phone")?.trim() || "";

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "ORDER_NUMBER_AND_PHONE_REQUIRED" }, { status: 400 });
    }
    if (!rateLimit(`track:${phoneKey(phone)}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order || order.phone !== normalizeDzPhone(phone)) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    let currentStatus = order.status;
    let carrierInfo: { status: string; global_status: string } | null = null;

    // Live carrier status when a tracking number exists
    if (order.trackingNumber) {
      try {
        const info = await getTracking(order.trackingNumber);
        if (info) {
          carrierInfo = { status: info.status, global_status: info.global_status };
          const mapped = mapCarrierStatus(info.status, info.global_status);
          if (mapped && ORDER_STATUSES.includes(mapped as (typeof ORDER_STATUSES)[number]) && mapped !== order.status) {
            const updated = await updateOrderStatusAtomic(order.id, mapped, {
              by: "carrier_sync",
              extraData: {
                carrierStatus: info.status,
                globalStatus: info.global_status,
                deliveredAt: mapped === "DELIVERED" ? new Date() : order.deliveredAt,
              },
            });
            currentStatus = updated.status;
          }
        }
      } catch {
        // carrier unreachable → show stored status (never a guessed one)
      }
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: currentStatus,
        customerName: order.customerName,
        createdAt: order.createdAt,
        deliveryType: order.deliveryType,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        carrierStatus: carrierInfo?.status || order.carrierStatus,
        globalStatus: carrierInfo?.global_status || order.globalStatus,
        sentToCarrierAt: order.sentToCarrierAt,
        deliveredAt: order.deliveredAt,
        total: order.total,
        wilayaName: order.wilayaName,
        commune: order.commune,
        items: order.items.map((i) => ({
          productName: i.productName,
          productImage: i.productImage,
          variantSelections: i.variantSelections,
          quantity: i.quantity,
          giftBox: i.giftBox,
          lineTotal: i.lineTotal,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "LOOKUP_FAILED" }, { status: 500 });
  }
}
