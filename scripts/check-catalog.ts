import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const products = await db.product.count();
  const cats = await db.category.count();
  const orders = await db.order.count();
  console.log(JSON.stringify({ products, categories: cats, orders }));
  const heroImg = await db.setting.findFirst({ where: { key: "heroImage" } });
  console.log("heroImage setting:", heroImg?.value ?? "(unset)");
}
main().finally(() => db.$disconnect());
