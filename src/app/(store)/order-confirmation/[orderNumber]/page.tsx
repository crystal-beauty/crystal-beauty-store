import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ConfirmationView from "@/components/store/confirmation-view";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commande confirmée" };

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

  const settings = await getSettings();

  return (
    <ConfirmationView
      order={{
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        wilayaName: order.wilayaName,
        commune: order.commune,
        deliveryType: order.deliveryType,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
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
      whatsappNumber={settings.whatsappNumber}
      pixelEventId={event || order.pixelEventId || ""}
    />
  );
}
