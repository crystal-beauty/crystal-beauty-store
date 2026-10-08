import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/admin/orders/[id]/ship — book a World Express shipment.
 * Calls the World Express REST API configured in Dashboard → Shipping.
 * If the API is unreachable / not configured, returns a clear message so the
 * store owner can fall back to manual tracking numbers.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const settings = await getSettings();
  if (!settings.worldExpressEnabled) {
    return NextResponse.json({ error: "World Express integration is disabled in Shipping settings." }, { status: 400 });
  }
  if (!settings.worldExpressApiUrl) {
    return NextResponse.json(
      { error: "No World Express API URL configured. Add it in Dashboard → Shipping, or set the tracking number manually." },
      { status: 400 }
    );
  }

  const payload = {
    customer_id: settings.worldExpressCustomerId || undefined,
    reference: order.orderNumber,
    service: "EXPRESS",
    sender: { name: settings.storeName, phone: settings.contactPhone, country: settings.originCountry },
    recipient: {
      name: order.customerName,
      phone: order.phone,
      email: order.email,
      country: order.country,
      city: order.city,
      address: order.address,
      postal_code: order.postalCode || undefined,
    },
    parcels: [
      {
        weight_kg: 1,
        contents: order.items.map((i) => ({ description: i.productName, quantity: i.quantity, value: i.unitPrice })),
        declared_value: order.total,
        currency: order.currency,
      },
    ],
    cod_amount: order.paymentMethod === "COD" ? order.total : 0,
  };

  try {
    const res = await fetch(settings.worldExpressApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.worldExpressApiKey ? { Authorization: `Bearer ${settings.worldExpressApiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const trackingNumber =
      (data.tracking_number as string) ||
      (data.trackingNumber as string) ||
      ((data.shipment as Record<string, unknown> | undefined)?.tracking_number as string) ||
      ((data.data as Record<string, unknown> | undefined)?.tracking_number as string) ||
      "";

    const order2 = await db.order.update({
      where: { id },
      data: {
        carrier: "World Express",
        trackingNumber: trackingNumber || null,
        shipmentStatus: res.ok ? "BOOKED" : "BOOKING_FAILED",
        shipmentResponse: JSON.stringify({ status: res.status, response: data }).slice(0, 5000),
        status: res.ok && trackingNumber ? "SHIPPED" : order.status,
        shippedAt: res.ok && trackingNumber ? new Date() : order.shippedAt,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `World Express API responded with status ${res.status}. You can set the tracking number manually.`, order: order2 },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, order: order2, trackingNumber });
  } catch {
    const order2 = await db.order.update({
      where: { id },
      data: {
        carrier: "World Express",
        shipmentStatus: "BOOKING_FAILED",
        shipmentResponse: JSON.stringify({ error: "API request failed or timed out" }).slice(0, 5000),
      },
    });
    return NextResponse.json(
      { error: "Could not reach the World Express API. Check the API URL / key in Shipping settings, or set the tracking number manually.", order: order2 },
      { status: 502 }
    );
  }
}
