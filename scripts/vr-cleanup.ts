/**
 * Visual-review cleanup — removes EVERYTHING the VR seed created:
 * tagged products (sku TEST-VR*), VR categories, VR order, VR images.
 * Leaves real data and settings untouched.
 */
import { PrismaClient } from "@prisma/client";
import { unlinkSync, existsSync } from "fs";

const db = new PrismaClient();

const IMAGES = [
  "public/uploads/vr-test-crystal-ball.svg",
  "public/uploads/vr-test-rose.svg",
  "public/uploads/vr-test-cat.svg",
];

async function main() {
  const orders = await db.order.deleteMany({ where: { customerName: "TEST-VR Client" } });
  const products = await db.product.deleteMany({ where: { sku: { startsWith: "TEST-VR" } } });
  const categories = await db.category.deleteMany({ where: { slug: { startsWith: "test-vr" } } });
  const reviews = await db.review.deleteMany({ where: { customerName: "TEST-VR Client" } });

  for (const p of IMAGES) {
    try {
      if (existsSync(p)) unlinkSync(p);
    } catch (e) {
      console.warn("image:", (e as Error).message);
    }
  }

  const remainingProducts = await db.product.count();
  const remainingOrders = await db.order.count();
  console.log({ orders: orders.count, products: products.count, categories: categories.count, reviews: reviews.count, remainingProducts, remainingOrders });
}

main().finally(() => db.$disconnect());
