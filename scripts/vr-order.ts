/**
 * TEMPORARY visual-review order — tagged TEST-VR, removed by vr-cleanup.ts.
 * Inserted directly (not via API) because the live carrier fee is required
 * for real orders and the carrier token is currently missing.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.order.deleteMany({ where: { customerName: "TEST-VR Client" } });

  const product = await db.product.findFirst({ where: { sku: "TEST-VR-001" } });
  if (!product) throw new Error("VR product missing — run vr-seed first");

  const now = new Date();
  const order = await db.order.create({
    data: {
      orderNumber: "LG-VRTEST1",
      status: "IN_DELIVERY",
      customerName: "TEST-VR Client",
      phone: "0555000000",
      wilayaId: 16,
      wilayaName: "Alger",
      commune: "Alger Centre",
      address: "Rue de la Liberte 123",
      deliveryType: "HOME",
      deliveryFee: 700,
      subtotal: product.price,
      giftBoxFee: 500,
      total: product.price + 700 + 500,
      carrier: "World Express",
      trackingNumber: "VR-TRACK-0001",
      carrierStatus: "IN_DELIVERY",
      statusHistory: JSON.stringify([
        { status: "NEW", at: new Date(now.getTime() - 86400000).toISOString(), by: "system" },
        { status: "CONFIRMED", at: new Date(now.getTime() - 82800000).toISOString(), by: "admin" },
        { status: "SENT_TO_CARRIER", at: new Date(now.getTime() - 72000000).toISOString(), by: "admin" },
        { status: "IN_DELIVERY", at: new Date(now.getTime() - 36000000).toISOString(), by: "carrier" },
      ]),
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            productImage: "/uploads/vr-test-crystal-ball.svg",
            variantSelections: JSON.stringify({ Taille: "Petite (8 cm)" }),
            unitPrice: product.price,
            quantity: 1,
            lineTotal: product.price,
            giftBox: true,
          },
        ],
      },
    },
  });
  console.log("VR order OK:", order.orderNumber);
}

main().finally(() => db.$disconnect());
