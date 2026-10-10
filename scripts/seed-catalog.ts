/**
 * Lumina Gifts — starter catalog seed.
 * Adds 3 categories + 9 realistic gift products (Algerian market, DZD),
 * with variants (size / scent / color swatches), illustrated navy-white
 * images generated in the same art direction as the hero.
 *
 * SAFETY: only runs when the catalog is empty (or FORCE=1).
 * All rows are full regular rows (no TEST tags) — the owner asked for
 * this starter catalog and can edit/remove everything in the dashboard.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const C = "/uploads/catalog";
const media = (file: string, alt: string, extra?: { file: string; alt: string }) =>
  JSON.stringify([
    { type: "image", url: `${C}/${file}`, alt },
    ...(extra ? [{ type: "image", url: `${C}/${extra.file}`, alt: extra.alt }] : []),
  ]);

async function main() {
  const existing = await db.product.count({ where: { sku: { startsWith: "LG-" } } });
  if (existing > 0 && process.env.FORCE !== "1") {
    console.log(`Catalog already seeded (${existing} LG- products). Aborting (use FORCE=1 to reseed).`);
    return;
  }
  if (existing > 0) {
    await db.product.deleteMany({ where: { sku: { startsWith: "LG-" } } });
    await db.category.deleteMany({ where: { slug: { in: ["luminaires", "coffrets-bougies", "peluches-fleurs"] } } });
  }

  // ---------- CATEGORIES ----------
  const catLum = await db.category.create({
    data: {
      name: "Luminaires",
      slug: "luminaires",
      description: "Lampes lune, veilleuses et projecteurs d'étoiles — une lumière douce pour chaque instant.",
      image: `${C}/cat-luminaires.png`,
      sortOrder: 0,
    },
  });
  const catCof = await db.category.create({
    data: {
      name: "Coffrets & Bougies",
      slug: "coffrets-bougies",
      description: "Coffrets cadeaux prêts à offrir, bougies parfumées et mugs — l'attention qui fait toujours plaisir.",
      image: `${C}/cat-coffrets.png`,
      sortOrder: 1,
    },
  });
  const catPel = await db.category.create({
    data: {
      name: "Peluches & Fleurs",
      slug: "peluches-fleurs",
      description: "Peluches tout douces, roses éternelles et bouquets qui ne fanent jamais.",
      image: `${C}/cat-peluches.png`,
      sortOrder: 2,
    },
  });

  // ---------- PRODUCTS ----------
  // 1. Lampe Lune (featured, promo)
  await db.product.create({
    data: {
      name: "Lampe Lune « Lumina »",
      slug: "lampe-lune-lumina",
      sku: "LG-LUM-001",
      shortDescription: "Une lune apaisante qui diffuse une lumière douce et réconfortante dans la chambre.",
      description:
        "La lampe Lune « Lumina » recrée la douceur de la lune chez vous. Posée sur son socle élégant, elle diffuse une lumière tamisée, parfaite pour accompagner les soirées, rassurer les enfants au coucher ou créer une ambiance chaleureuse pendant les veillées.\n\nChaque lampe est vérifiée avant l'envoi : lumière homogène, socle stable et finition soignée. Elle est livrée prête à l'emploi, avec son câble d'alimentation. Un cadeau qui plaît aussi bien aux enfants qu'aux adultes — et qui se remarque dès l'allumage.",
      price: 4900,
      comparePrice: 6200,
      stock: 15,
      trackStock: true,
      active: true,
      featured: true,
      weightGrams: 800,
      media: media("prod-lampe-lune.png", "Lampe Lune Lumina sur son socle", {
        file: "cat-luminaires.png",
        alt: "Ambiance collection Luminaires",
      }),
      categoryId: catLum.id,
      variants: {
        create: [
          {
            name: "Taille",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Petite — 12 cm", priceModifier: 0, stock: 8, sortOrder: 0 },
                { label: "Grande — 18 cm", priceModifier: 1500, stock: 7, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. Veilleuse projecteur d'étoiles (color swatches)
  await db.product.create({
    data: {
      name: "Veilleuse Projecteur d'Étoiles",
      slug: "veilleuse-projecteur-etoiles",
      sku: "LG-LUM-002",
      shortDescription: "Transforme le plafond en ciel étoilé — la veilleuse préférée des rêveurs.",
      description:
        "Allumez le projecteur et voilà : votre plafond se couvre d'étoiles. Cette veilleuse projette un ciel nocturne apaisant qui aide les enfants à s'endormir en douceur et donne aux soirées d'adultes une atmosphère magique.\n\nSimple d'utilisation — un seul bouton — elle se pose sur une étagère ou une table de nuit. Livrée avec son câble d'alimentation, prête à fonctionner dès la réception. Un cadeau qui fait toujours son effet, à l'anniversaire comme à Aïd.",
      price: 3800,
      stock: 12,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 500,
      media: media("prod-veilleuse-etoiles.png", "Veilleuse projecteur d'étoiles en marche"),
      categoryId: catLum.id,
      variants: {
        create: [
          {
            name: "Couleur",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Bleu nuit", priceModifier: 0, hexColor: "#0a1f44", stock: 6, sortOrder: 0 },
                { label: "Noir", priceModifier: 0, hexColor: "#16181d", stock: 6, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Bougie parfumée
  await db.product.create({
    data: {
      name: "Bougie Parfumée « Nuit Étoilée »",
      slug: "bougie-nuit-etoilee",
      sku: "LG-BOU-001",
      shortDescription: "Cire végétale, parfum délicat et jolie jar étoilée à garder après usage.",
      description:
        "Une bougie qui sent bon sans être entêtante. La cire fond uniformément et libère un parfum doux qui enveloppe la pièce — idéale pour une soirée calme, un bain relaxant ou un dîner en amoureux.\n\nLa jar en verre bleu nuit ornée d'étoiles se garde une fois la bougie terminée : pot à crayons, petit vase ou rangement de bijoux. Un cadeau utile deux fois, à petit prix.",
      price: 1800,
      stock: 24,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 350,
      media: media("prod-bougie.png", "Bougie parfumée Nuit Étoilée dans sa jar étoilée"),
      categoryId: catCof.id,
      variants: {
        create: [
          {
            name: "Parfum",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Vanille & Oud", priceModifier: 0, stock: 10, sortOrder: 0 },
                { label: "Cannelle Épicée", priceModifier: 0, stock: 8, sortOrder: 1 },
                { label: "Jasmin Blanc", priceModifier: 200, stock: 6, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. Coffret Signature (featured, promo)
  await db.product.create({
    data: {
      name: "Coffret Signature « Lumina »",
      slug: "coffret-signature-lumina",
      sku: "LG-COF-001",
      shortDescription: "Le cadeau complet prêt à offrir : bougie, mug et carte message dans un coffret soigné.",
      description:
        "Quand on ne sait pas quoi offrir, le coffret Signature est la réponse. Réunis dans une boîte rigide au ruban blanc : une bougie parfumée « Nuit Étoilée », un mug « Lune & Étoiles » et une carte message à personnaliser de votre main.\n\nLe coffret arrive prêt à offrir — pas besoin d'emballage ni d'ajouts. Choisissez l'occasion (anniversaire, mariage, naissance) et nous adaptons la présentation de la carte. C'est le cadeau qui paraît bien plus cher qu'il ne l'est.",
      price: 7500,
      comparePrice: 8900,
      stock: 8,
      trackStock: true,
      active: true,
      featured: true,
      weightGrams: 1500,
      media: media("prod-coffret.png", "Coffret Signature Lumina ouvert", {
        file: "cat-coffrets.png",
        alt: "Coffrets et bougie — présentation",
      }),
      categoryId: catCof.id,
      variants: {
        create: [
          {
            name: "Occasion",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Anniversaire", priceModifier: 0, stock: 4, sortOrder: 0 },
                { label: "Mariage", priceModifier: 0, stock: 2, sortOrder: 1 },
                { label: "Naissance", priceModifier: 0, stock: 2, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 5. Mug (no variants — simple product)
  await db.product.create({
    data: {
      name: "Mug « Lune & Étoiles »",
      slug: "mug-lune-etoiles",
      sku: "LG-MUG-001",
      shortDescription: "Un mug bleu nuit à motif lune et étoiles, pour des pauses café féeriques.",
      description:
        "Un mug épais et agréable en main, imprimé d'une lune et d'étoiles blanches sur fond bleu nuit. Le motif est cuit dans l'émail : il ne s'efface pas au lave-vaisselle ni aux lavages répétés.\n\nC'est le petit cadeau qui va avec tout : offert seul avec du thé ou du café dedans, glissé dans un coffret, ou pris en duo avec la bougie assortie. Contenance généreuse pour les vrais amateurs de café.",
      price: 1200,
      stock: 30,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 350,
      media: media("prod-mug.png", "Mug Lune & Étoiles bleu nuit"),
      categoryId: catCof.id,
    },
  });

  // 6. Peluche Ours
  await db.product.create({
    data: {
      name: "Peluche Ours « Nuage »",
      slug: "peluche-ours-nuage",
      sku: "LG-PEL-001",
      shortDescription: "Un ours tout doux au toucher nuage, avec son petit cœur blanc cousu.",
      description:
        "L'ours « Nuage » doit son nom à sa douceur : une peluche dense et soyeuse qu'on a envie de serrer. Son cœur blanc cousu en fait un cadeau attentionné — pour une déclaration, une naissance ou simplement pour consoler.\n\nCousu solidement, il supporte les câlins intensifs et se nettoie facilement à la main. Disponible en deux tailles : le moyen se pose sur un lit ou une étagère, le grand devient le compagnon de canapé parfait.",
      price: 3200,
      stock: 18,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 450,
      media: media("prod-ours.png", "Peluche Ours Nuage avec cœur blanc"),
      categoryId: catPel.id,
      variants: {
        create: [
          {
            name: "Taille",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Moyen — 40 cm", priceModifier: 0, stock: 10, sortOrder: 0 },
                { label: "Grand — 60 cm", priceModifier: 1200, stock: 8, sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  // 7. Rose éternelle (featured, low stock → badge)
  await db.product.create({
    data: {
      name: "Rose Éternelle sous Cloche",
      slug: "rose-eternelle-cloche",
      sku: "LG-FLE-001",
      shortDescription: "Une rose qui ne fane jamais, protégée sous sa cloche de verre.",
      description:
        "La rose qui ne fanera jamais. Préservée à son plus beau moment, elle reste intacte des années sous sa cloche de verre, posée sur un socle bois bleu nuit. C'est la promesse d'un sentiment qui dure.\n\nChaque rose est unique : légères variations de forme et de taille, exactement comme dans la nature. Livrée montée et protégée, prête à être offerte telle quelle — anniversaire, Saint-Valentin, ou sans raison du tout. Les stocks sont limités : chaque rose est préparée à la main.",
      price: 3500,
      stock: 4,
      trackStock: true,
      active: true,
      featured: true,
      weightGrams: 600,
      media: media("prod-rose.png", "Rose éternelle sous cloche de verre"),
      categoryId: catPel.id,
    },
  });

  // 8. Bouquet éternel (promo)
  await db.product.create({
    data: {
      name: "Bouquet de Fleurs Éternelles",
      slug: "bouquet-fleurs-eternelles",
      sku: "LG-FLE-002",
      shortDescription: "Un bouquet emballé avec soin qui garde sa beauté sans jamais se faner.",
      description:
        "Un bouquet qui garde son éclat année après année. Fleurs préservées et feuillages stylisés, emballés dans un papier bleu nuit et blanc noué d'un ruban satin — l'effet d'un vrai bouquet, sans le risque de le voir faner en une semaine.\n\nLivré dans son emballage, prêt à offrir. Idéal pour les grandes occasions comme pour un geste spontané : il reste sur la commode comme un souvenir durable de l'attention qui l'a accompagné.",
      price: 4200,
      comparePrice: 5000,
      stock: 6,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 700,
      media: media("prod-bouquet.png", "Bouquet de fleurs éternelles emballé"),
      categoryId: catPel.id,
    },
  });

  // 9. Plaid polaire (color swatches)
  await db.product.create({
    data: {
      name: "Plaid Polaire « Ciel d'Hiver »",
      slug: "plaid-ciel-hiver",
      sku: "LG-PLA-001",
      shortDescription: "Une couverture douce et légère à motif lune et étoiles, pour les soirées au frais.",
      description:
        "Le plaid « Ciel d'Hiver » enveloppe sans alourdir : une polaire douce sur les deux faces, imprimée d'un ciel nocturne — lune et étoiles blanches sur bleu nuit. Parfait pour les soirées télé, les lectures du soir ou les grands froids d'hiver.\n\nLéger une fois plié, il se glisse dans un placard ou sur un bras de canapé. Lavable en machine sans décoloration. Un cadeau confort par excellence — seul ou accompagné de la bougie assortie.",
      price: 4500,
      stock: 14,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 1200,
      media: media("prod-plaid.png", "Plaid polaire Ciel d'Hiver plié"),
      categoryId: catPel.id,
      variants: {
        create: [
          {
            name: "Couleur",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Bleu nuit", priceModifier: 0, hexColor: "#0a1f44", stock: 6, sortOrder: 0 },
                { label: "Gris perle", priceModifier: 0, hexColor: "#c7cdd6", stock: 4, sortOrder: 1 },
                { label: "Noir", priceModifier: 0, hexColor: "#16181d", stock: 4, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  const [pc, cc, fc] = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.variantOption.count(),
  ]);
  console.log(`Seeded: ${cc} categories, ${pc} products, ${fc} variant options.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
