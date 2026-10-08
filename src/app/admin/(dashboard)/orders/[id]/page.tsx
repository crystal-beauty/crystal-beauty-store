import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, canDelete } from "@/lib/auth";
import OrderDetail from "@/components/admin/order-detail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Details" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, session] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true } }),
    getSession(),
  ]);
  if (!order) notFound();

  return (
    <OrderDetail
      canDelete={session ? canDelete(session.role, "orders") : false}
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        country: order.country,
        city: order.city,
        address: order.address,
        postalCode: order.postalCode,
        notes: order.notes,
        giftMessage: order.giftMessage,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        giftBoxFee: order.giftBoxFee,
        total: order.total,
        promoCodeStr: order.promoCodeStr,
        shippingMethodName: order.shippingMethodName,
        paymentMethod: order.paymentMethod,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        shipmentStatus: order.shipmentStatus,
        shipmentResponse: order.shipmentResponse,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          productName: i.productName,
          productImage: i.productImage,
          variantSelections: i.variantSelections,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          giftBox: i.giftBox,
        })),
      }}
    />
  );
}
