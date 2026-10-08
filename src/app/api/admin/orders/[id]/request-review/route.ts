import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { toInternationalDz } from "@/lib/format";

/**
 * POST /api/admin/orders/[id]/request-review
 * Creates the one-time review token for a DELIVERED order and returns the
 * pre-filled WhatsApp message + link. One review per order (unique orderId).
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("orders");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Reviews can only be requested for delivered orders." }, { status: 400 });
  }

  let review = await db.review.findUnique({ where: { orderId: order.id } });
  if (!review) {
    review = await db.review.create({
      data: {
        orderId: order.id,
        productId: order.items[0]?.productId || null,
        token: crypto.randomBytes(16).toString("hex"),
        customerName: order.customerName,
        wilayaName: order.wilayaName,
      },
    });
  }

  await db.order.update({ where: { id: order.id }, data: { reviewRequestedAt: new Date() } });

  const origin = process.env.STORE_PUBLIC_URL || "";
  const reviewLink = `${origin}/review/${review.token}`;
  const message =
    `Bonjour ${order.customerName} 🎁\n\n` +
    `Merci pour votre commande ${order.orderNumber} !\n` +
    `Votre avis compte énormément pour nous — laissez-le ici (1 minute) :\n${reviewLink}\n\n` +
    `شكرًا لطلبك ${order.orderNumber}! نحن نقدر رأيك كثيرًا — اترك تقييمك هنا:\n${reviewLink}`;
  const waLink = `https://wa.me/${toInternationalDz(order.phone).replace("+", "")}?text=${encodeURIComponent(message)}`;

  return NextResponse.json({ ok: true, reviewLink, waLink, token: review.token, submitted: review.submitted });
}
