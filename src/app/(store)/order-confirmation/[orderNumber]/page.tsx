import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ConfirmationView from "@/components/store/confirmation-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Confirmed" };

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { orderNumber } = await params;
  const { event } = await searchParams;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <ConfirmationView
      order={{
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        email: order.email,
        city: order.city,
        country: order.country,
        shippingMethodName: order.shippingMethodName,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        giftBoxFee: order.giftBoxFee,
        total: order.total,
        promoCodeStr: order.promoCodeStr,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          productName: i.productName,
          productImage: i.productImage,
          variantSelections: i.variantSelections,
          quantity: i.quantity,
          giftBox: i.giftBox,
          lineTotal: i.lineTotal,
        })),
      }}
      pixelEventId={event || order.pixelEventId || ""}
    />
  );
}
