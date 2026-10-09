/* One-off: align stored accentColor with the navy/black/white charter */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.setting.findUnique({ where: { key: "accentColor" } });
  console.log("before:", before);
  await prisma.setting.upsert({
    where: { key: "accentColor" },
    update: { value: "#0A1F44" },
    create: { key: "accentColor", value: "#0A1F44" },
  });
  const after = await prisma.setting.findUnique({ where: { key: "accentColor" } });
  console.log("after:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
