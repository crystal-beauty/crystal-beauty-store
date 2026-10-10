import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Set the illustrated hero as the live hero image (owner can replace it any time
// from Dashboard → Settings → Hero). Illustration = brand artwork, not fake data.
async function main() {
  const value = "/uploads/hero-illustration.png";
  const existing = await db.setting.findFirst({ where: { key: "heroImage" } });
  if (existing) {
    await db.setting.update({ where: { key: "heroImage" }, data: { value } });
    console.log("heroImage updated:", value);
  } else {
    await db.setting.create({ data: { key: "heroImage", value } });
    console.log("heroImage created:", value);
  }
}
main().finally(() => db.$disconnect());
