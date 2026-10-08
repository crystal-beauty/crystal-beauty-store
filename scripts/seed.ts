import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-core";

const db = new PrismaClient();

function media(...urls: string[]): string {
  return JSON.stringify(urls.map((url, i) => ({ type: "image", url, alt: `Product photo ${i + 1}` })));
}

async function main() {
  console.log("🌱 Seeding Lumina Gifts…");

  // ---------- Team ----------
  const ownerEmail = "admin@luminagifts.com";
  const existingOwner = await db.teamMember.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await db.teamMember.create({
      data: {
        email: ownerEmail,
        name: "Store Owner",
        role: "OWNER",
        passwordHash: hashPassword("Admin@123"),
      },
    });
    console.log("✓ Owner: admin@luminagifts.com / Admin@123");
  }
  const staffEmail = "sara@luminagifts.com";
  const existingStaff = await db.teamMember.findUnique({ where: { email: staffEmail } });
  if (!existingStaff) {
    await db.teamMember.create({
      data: {
        email: staffEmail,
        name: "Sara Staff",
        role: "STAFF",
        passwordHash: hashPassword("Staff@123"),
      },
    });
    console.log("✓ Staff: sara@luminagifts.com / Staff@123");
  }

  // ---------- Categories ----------
  const cats = [
    { slug: "crystal-decor", name: "Crystal Decor", description: "Sparkling spheres, hearts and figurines carved from genuine crystal.", image: "/uploads/product-crystal-ball.jpg", sortOrder: 1 },
    { slug: "home-ambiance", name: "Home Ambiance", description: "Warm glows and golden accents for cozy evenings.", image: "/uploads/product-candle-holder.jpg", sortOrder: 2 },
    { slug: "keepsakes", name: "Keepsakes & Globes", description: "Little worlds and memories they'll keep forever.", image: "/uploads/product-snow-globe.jpg", sortOrder: 3 },
    { slug: "lamps-light", name: "Lamps & Light", description: "Magical lighting that turns rooms into wonderlands.", image: "/uploads/product-moon-lamp.jpg", sortOrder: 4 },
  ];
  for (const c of cats) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { description: c.description, image: c.image, sortOrder: c.sortOrder },
      create: c,
    });
  }
  const catId = (slug: string) => db.category.findUnique({ where: { slug } }).then((c) => c!.id);
  const [crystal, ambiance, keepsakes, lamps] = await Promise.all(cats.map((c) => catId(c.slug)));

  // ---------- Products ----------
  const products = [
    {
      slug: "enchanted-crystal-ball",
      name: "Enchanted Crystal Ball",
      sku: "LG-CB-001",
      shortDescription: "A flawless K9 crystal sphere that catches light like captured stardust — the gift that never stops sparkling.",
      description:
        "Our signature piece. Hand-cut from flawless K9 crystal and polished to a mirror finish, the Enchanted Crystal Ball bends light into dancing rainbows across any room.\n\n• Diameter: 80mm of pure optical crystal\n• Includes a premium navy velvet display cushion\n• Every ball inspected by hand before dispatch\n\nShips as a single gift piece — add an elegant gift box at checkout if you'd like it wrapped.",
      price: 49.99,
      comparePrice: 69.99,
      costPrice: 18,
      stock: 24,
      featured: true,
      categoryId: crystal,
      media: media("/uploads/product-crystal-ball.jpg", "/uploads/product-crystal-ball-2.jpg", "/uploads/hero.jpg"),
      variants: [
        {
          name: "Size", required: true, options: [
            { label: "Small · 60mm", priceModifier: -10, stock: 15 },
            { label: "Classic · 80mm", priceModifier: 0, stock: 24 },
            { label: "Grand · 100mm", priceModifier: 25, stock: 8 },
          ],
        },
      ],
    },
    {
      slug: "rose-quartz-heart",
      name: "Rose Quartz Heart",
      sku: "LG-RQ-002",
      shortDescription: "A palm-polished heart of genuine rose quartz — love, in mineral form.",
      description:
        "Mined, cut and hand-polished into a perfectly smooth heart, rose quartz has been the stone of unconditional love for centuries. Give it to someone whose heart you'd like to keep.\n\n• Genuine rose quartz, 45mm\n• Soft pink tones — no two are identical\n• Arrives in a protective velvet pouch",
      price: 29.99,
      comparePrice: null,
      costPrice: 9,
      stock: 40,
      featured: true,
      categoryId: crystal,
      media: media("/uploads/product-rose-heart.jpg"),
      variants: [],
    },
    {
      slug: "amethyst-dream-sphere",
      name: "Amethyst Dream Sphere",
      sku: "LG-AM-003",
      shortDescription: "Deep violet amethyst with natural sparkle — calm and beauty in one sphere.",
      description:
        "A sphere of genuine amethyst with dreamy violet depths and natural facets that sparkle in evening light. Beloved for its calming presence on a desk or bedside table.\n\n• Genuine amethyst, ~70mm\n• Natural banding — every piece is unique\n• Navy velvet cushion included",
      price: 39.99,
      comparePrice: 54.99,
      costPrice: 14,
      stock: 18,
      featured: true,
      categoryId: crystal,
      media: media("/uploads/product-amethyst-sphere.jpg"),
      variants: [],
    },
    {
      slug: "celestial-moon-lamp",
      name: "Celestial Moon Lamp",
      sku: "LG-ML-004",
      shortDescription: "NASA-mapped lunar surface, printed glow by glow. Two colors of moonlight in one tap.",
      description:
        "Based on real NASA lunar topography, this 3D-printed moon glows exactly like the real thing. Tap once for warm golden light, twice for cool starlight.\n\n• 15cm diameter, wooden stand included\n• USB-rechargeable — up to 12 hours of glow\n• Warm white / cool white modes",
      price: 54.99,
      comparePrice: 74.99,
      costPrice: 22,
      stock: 15,
      featured: true,
      categoryId: lamps,
      media: media("/uploads/product-moon-lamp.jpg"),
      variants: [
        {
          name: "Size", required: true, options: [
            { label: "12cm", priceModifier: -8, stock: 6 },
            { label: "15cm", priceModifier: 0, stock: 15 },
            { label: "20cm", priceModifier: 20, stock: 4 },
          ],
        },
      ],
    },
    {
      slug: "golden-hour-candle-holder",
      name: "Golden Hour Candle Holder",
      sku: "LG-CH-005",
      shortDescription: "Brushed gold holder that turns any dinner into golden hour.",
      description:
        "Weighted, brushed-gold metal with a soft honey glow when lit. Sold as a single holder — pair two for the full dinner-table moment.\n\n• Solid metal, 14cm tall\n• Fits standard pillar candles\n• Hand-brushed finish — slight variations are the charm",
      price: 27.99,
      comparePrice: null,
      costPrice: 10,
      stock: 30,
      featured: false,
      categoryId: ambiance,
      media: media("/uploads/product-candle-holder.jpg"),
      variants: [],
    },
    {
      slug: "starlight-snow-globe",
      name: "Starlight Snow Globe",
      sku: "LG-SG-006",
      shortDescription: "A golden castle in a swirl of snow — childhood magic, glass-made.",
      description:
        "Shake it gently and watch golden snow settle over a miniature castle. The kind of gift that gets shaken every single time it's walked past.\n\n• Hand-painted resin castle, glass globe\n• 12cm tall\n• Glitter-swirl liquid, sealed",
      price: 32.99,
      comparePrice: null,
      costPrice: 12,
      stock: 22,
      featured: false,
      categoryId: keepsakes,
      media: media("/uploads/product-snow-globe.jpg"),
      variants: [],
    },
    {
      slug: "aurora-crystal-wind-chime",
      name: "Aurora Crystal Wind Chime",
      sku: "LG-WC-007",
      shortDescription: "Golden wood tones and crystal pendants that sing with the breeze.",
      description:
        "A warm wooden crown holds strands of crystal pendants that catch sunlight by day and sing softly in the evening breeze. Beautiful on a balcony or by a sunny window.\n\n• 60cm drop, wooden top\n• 6 crystal pendant strands\n• Gift-ready as a single piece",
      price: 44.99,
      comparePrice: 59.99,
      costPrice: 17,
      stock: 12,
      featured: false,
      categoryId: ambiance,
      media: media("/uploads/product-wind-chime.jpg"),
      variants: [],
    },
    {
      slug: "crystal-bloom-figurine",
      name: "Crystal Bloom Figurine",
      sku: "LG-BF-008",
      shortDescription: "A crystal lotus that scatters rainbows wherever the light lands.",
      description:
        "Faceted like petals, this crystal lotus throws rainbow prisms across the room when sunlight finds it. A quiet, meaningful gift for someone starting a new chapter.\n\n• Optical crystal, 10cm wide\n• Velvet-lined gift pouch included\n• Hand-inspected sparkle check",
      price: 34.99,
      comparePrice: null,
      costPrice: 13,
      stock: 20,
      featured: false,
      categoryId: crystal,
      media: media("/uploads/product-crystal-lotus.jpg"),
      variants: [],
    },
  ];

  for (const p of products) {
    const { variants, ...data } = p;
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`• product exists: ${p.slug}`);
      continue;
    }
    await db.product.create({
      data: {
        ...data,
        variants: {
          create: variants.map((v, vi) => ({
            name: v.name,
            required: v.required,
            sortOrder: vi,
            options: {
              create: v.options.map((o, oi) => ({
                label: o.label,
                priceModifier: o.priceModifier,
                stock: o.stock,
                sortOrder: oi,
              })),
            },
          })),
        },
      },
    });
    console.log(`✓ product: ${p.slug}`);
  }

  // ---------- Promo codes ----------
  const promos = [
    { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 0, maxUses: null as number | null, expiresAt: null as Date | null },
    { code: "GIFT20", type: "FIXED", value: 20, minOrder: 80, maxUses: 100, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
  ];
  for (const pr of promos) {
    await db.promoCode.upsert({
      where: { code: pr.code },
      update: { value: pr.value, minOrder: pr.minOrder },
      create: pr,
    });
    console.log(`✓ promo: ${pr.code}`);
  }

  // ---------- Shipping rates (World Express) ----------
  const rates = [
    { name: "Express Air", carrier: "World Express", country: "*", city: null, price: 18.99, estimatedDays: "2-4", freeOver: null as number | null, sortOrder: 1 },
    { name: "Standard Air", carrier: "World Express", country: "*", city: null, price: 9.99, estimatedDays: "5-9", freeOver: null as number | null, sortOrder: 2 },
    { name: "Domestic Courier", carrier: "World Express", country: "United Arab Emirates", city: null, price: 4.99, estimatedDays: "1-2", freeOver: null as number | null, sortOrder: 3 },
    { name: "Dubai Same-Day", carrier: "World Express", country: "United Arab Emirates", city: "Dubai", price: 7.99, estimatedDays: "0-1", freeOver: 150 as number | null, sortOrder: 4 },
    { name: "Express to USA", carrier: "World Express", country: "United States", city: null, price: 24.99, estimatedDays: "3-5", freeOver: null as number | null, sortOrder: 5 },
    { name: "Express to UK", carrier: "World Express", country: "United Kingdom", city: null, price: 22.99, estimatedDays: "3-6", freeOver: null as number | null, sortOrder: 6 },
  ];
  for (const r of rates) {
    const exists = await db.shippingRate.findFirst({ where: { name: r.name, carrier: r.carrier, country: r.country } });
    if (!exists) await db.shippingRate.create({ data: r });
  }
  console.log("✓ shipping rates");

  console.log("🎉 Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
