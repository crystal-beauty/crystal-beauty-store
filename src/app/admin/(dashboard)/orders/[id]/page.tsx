import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, canDelete } from "@/lib/auth";
import { phoneHasRefusals } from "@/lib/order-guard";
import OrderDetail from "@/components/admin/order-detail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Détail commande" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, session] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true } }),
    getSession(),
  ]);
  if (!order) notFound();

  const refusedWarning = await phoneHasRefusals(order.phone);

  return (
    <OrderDetail
      canDelete={session ? canDelete(session.role, "orders") : false}
      refusedWarning={refusedWarning}
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        wilayaId: order.wilayaId,
        wilayaName: order.wilayaName,
        commune: order.commune,
        address: order.address,
        deliveryType: order.deliveryType,
        stopDeskName: order.stopDeskName,
        notes: order.notes,
        giftMessage: order.giftMessage,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        giftBoxFee: order.giftBoxFee,
        total: order.total,
        promoCodeStr: order.promoCodeStr,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        carrierStatus: order.carrierStatus,
        globalStatus: order.globalStatus,
        shipmentResponse: order.shipmentResponse,
        reviewRequestedAt: order.reviewRequestedAt?.toISOString() || null,
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
