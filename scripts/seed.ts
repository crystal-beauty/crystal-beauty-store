import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-core";

const db = new PrismaClient();

/**
 * Clean seed for the Algerian COD store.
 * NO demo products, NO demo orders, NO fake promos, NO fake shipping rates.
 * Only the team accounts the owner needs to log in. The catalog starts empty
 * and everything is added from the dashboard.
 */
async function main() {
  console.log("🌱 Seeding team accounts only (catalog stays empty — no demo data)…");

  const ownerEmail = "admin@crystalbeauty.dz";
  const existingOwner = await db.teamMember.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await db.teamMember.create({
      data: {
        email: ownerEmail,
        name: "Crystal Beauty Owner",
        role: "OWNER",
        passwordHash: hashPassword("Admin@123"),
      },
    });
    console.log("✓ Owner: admin@crystalbeauty.dz / Admin@123");
  } else {
    console.log("• owner exists");
  }

  const staffEmail = "staff@crystalbeauty.dz";
  const existingStaff = await db.teamMember.findUnique({ where: { email: staffEmail } });
  if (!existingStaff) {
    await db.teamMember.create({
      data: {
        email: staffEmail,
        name: "Crystal Beauty Staff",
        role: "STAFF",
        passwordHash: hashPassword("Staff@123"),
      },
    });
    console.log("✓ Staff: staff@crystalbeauty.dz / Staff@123");
  } else {
    console.log("• staff exists");
  }

  const counts = {
    products: await db.product.count(),
    orders: await db.order.count(),
    promos: await db.promoCode.count(),
    categories: await db.category.count(),
  };
  console.log(`Catalog state: ${JSON.stringify(counts)} — all zero means clean start.`);
  console.log("🎉 Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
