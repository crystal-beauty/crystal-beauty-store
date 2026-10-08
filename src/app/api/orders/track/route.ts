import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/orders/track?orderNumber=LG-XXXX&email=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim().toUpperCase();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required." }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order || (email && order.email !== email)) {
      return NextResponse.json({ error: "No order found with these details." }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        createdAt: order.createdAt,
        shippingMethodName: order.shippingMethodName,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        shipmentStatus: order.shipmentStatus,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        total: order.total,
        currency: order.currency,
        city: order.city,
        country: order.country,
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
    return NextResponse.json({ error: "Could not look up the order." }, { status: 500 });
  }
}
