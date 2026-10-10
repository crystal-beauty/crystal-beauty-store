import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding luxury editorial catalog for Crystal Beauty...");

  // 1. Update hero image setting
  await db.setting.upsert({
    where: { key: "heroImage" },
    update: { value: "/uploads/hero-luxury.jpg" },
    create: { key: "heroImage", value: "/uploads/hero-luxury.jpg" },
  });

  await db.setting.upsert({
    where: { key: "heroTitle" },
    update: { value: "L'Excellence des Soins & Coffrets d'Exception" },
    create: { key: "heroTitle", value: "L'Excellence des Soins & Coffrets d'Exception" },
  });

  await db.setting.upsert({
    where: { key: "heroTitleAr" },
    update: { value: "أرقى منتجات العناية والهدايا الفاخرة" },
    create: { key: "heroTitleAr", value: "أرقى منتجات العناية والهدايا الفاخرة" },
  });

  await db.setting.upsert({
    where: { key: "heroSubtitle" },
    update: { value: "Formules précieuses, flacons de cristal et rituels de beauté exclusifs. Livraison express 58 wilayas et paiement à la livraison." },
    create: { key: "heroSubtitle", value: "Formules précieuses, flacons de cristal et rituels de beauté exclusifs. Livraison express 58 wilayas et paiement à la livraison." },
  });

  await db.setting.upsert({
    where: { key: "heroSubtitleAr" },
    update: { value: "تركيبات فاخرة، عطور وعناية فائقة الجودة مع توصيل سريع عبر 58 ولاية ودفع آمن عند الاستلام." },
    create: { key: "heroSubtitleAr", value: "تركيبات فاخرة، عطور وعناية فائقة الجودة مع توصيل سريع عبر 58 ولاية ودفع آمن عند الاستلام." },
  });

  // Clear previous catalog products
  await db.variantOption.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  // 2. Create Luxury Categories
  const catSoins = await db.category.create({
    data: {
      name: "Soins & Rituels Visage",
      slug: "soins-visage",
      description: "Sérums botaniques précieux, crèmes soyeuses et élixirs formulés pour sublimer l'éclat de votre peau.",
      image: "/uploads/cat-soins.jpg",
      sortOrder: 0,
    },
  });

  const catCoffrets = await db.category.create({
    data: {
      name: "Coffrets & Parfums",
      slug: "coffrets-parfums",
      description: "Coffrets prestigieux prêts à offrir, flacons de cristal ciselé et fragrances envoûtantes.",
      image: "/uploads/cat-coffrets.jpg",
      sortOrder: 1,
    },
  });

  const catAccessoires = await db.category.create({
    data: {
      name: "Accessoires & Beauté",
      slug: "accessoires-beaute",
      description: "Rollers en quartz rose véritable, gua sha sculptant et accessoires d'exception pour vos rituels bien-être.",
      image: "/uploads/cat-accessoires.jpg",
      sortOrder: 2,
    },
  });

  // 3. Create Products with Editorial Photography
  // Product 1: Sérum Crystal Elixir
  const p1 = await db.product.create({
    data: {
      name: "Sérum Anti-Âge « Crystal Elixir »",
      slug: "serum-anti-age-crystal-elixir",
      sku: "CB-SERUM-01",
      price: 4900,
      comparePrice: 6200,
      costPrice: 2200,
      stock: 18,
      trackStock: true,
      featured: true,
      active: true,
      categoryId: catSoins.id,
      shortDescription: "Formule botanique précieuse enrichie en actifs hydratants et réflecteurs de lumière.",
      description: `Offrez à votre peau une cure de jeunesse et d'éclat avec le sérum « Crystal Elixir ».

- Flacon lourd en verre dépoli avec pipette compte-gouttes dorée
- Texture ultra-légère à absorption rapide, sans fini gras
- Hydrate intensément, lisse les ridules et illumine le teint dès la première application
- Convient à tous les types de peau, même sensibles

Conseils d'utilisation : appliquez 3 à 4 gouttes matin et soir sur le visage et le cou parfaitement nettoyés avant votre crème de jour.`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-serum-crystal.jpg", alt: "Sérum Crystal Elixir" }]),
      variants: {
        create: [
          {
            name: "Format",
            required: true,
            options: {
              create: [
                { label: "Flacon 30 ml", priceModifier: 0, stock: 12 },
                { label: "Grand Format 50 ml", priceModifier: 1500, stock: 6 },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 2: Eau de Parfum Étoile de Minuit
  const p2 = await db.product.create({
    data: {
      name: "Eau de Parfum « Étoile de Minuit »",
      slug: "eau-de-parfum-etoile-de-minuit",
      sku: "CB-PARF-02",
      price: 6800,
      comparePrice: 8500,
      costPrice: 3100,
      stock: 14,
      trackStock: true,
      featured: true,
      active: true,
      categoryId: catCoffrets.id,
      shortDescription: "Flacon en cristal diamanté abritant un sillage oriental floral captivant et longue tenue.",
      description: `Une création olfactive raffinée qui célèbre la sensualité et l'élégance intemporelle.

- Flacon magistral en cristal ciselé facette diamant avec bouchon orné
- Pyramide olfactive : notes de tête florales fraîches, cœur jasmin & fleur d'oranger, fond vanille ambrée et musc blanc
- Tenue exceptionnelle supérieure à 24 heures
- Idéal pour les grandes occasions et les soirées d'exception

Livré dans son écrin de protection luxueux prêt à être offert.`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-parfum-crystal.jpg", alt: "Eau de Parfum Étoile de Minuit" }]),
      variants: {
        create: [
          {
            name: "Contenance",
            required: true,
            options: {
              create: [
                { label: "50 ml", priceModifier: 0, stock: 8 },
                { label: "100 ml Prestige", priceModifier: 2200, stock: 6 },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 3: Coffret Signature Crystal Prestige
  const p3 = await db.product.create({
    data: {
      name: "Coffret Signature « Crystal Prestige »",
      slug: "coffret-signature-crystal-prestige",
      sku: "CB-BOX-03",
      price: 7500,
      comparePrice: 9200,
      costPrice: 3500,
      stock: 9,
      trackStock: true,
      featured: true,
      active: true,
      categoryId: catCoffrets.id,
      shortDescription: "Écrin bleu nuit & doré doublé de satin de soie réunissant parfum d'exception et sérum précieux.",
      description: `Le cadeau d'exception par excellence, conçu pour émerveiller dès le premier regard.

Ce coffret signature comprend :
1. Une Eau de Parfum Crystal 50 ml aux notes envoûtantes
2. Un Sérum Éclat Crystal Elixir 30 ml
3. Boîte rigide texturée bleu nuit frappée d'or avec calage en soie champagne

Une présentation digne des plus grandes maisons de luxe parisiennes.`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-coffret-signature.jpg", alt: "Coffret Signature Crystal Prestige" }]),
      variants: {
        create: [
          {
            name: "Finition Ruban",
            required: true,
            options: {
              create: [
                { label: "Satin Bleu Nuit", priceModifier: 0, hexColor: "#0a1f44", stock: 5 },
                { label: "Satin Or Champagne", priceModifier: 0, hexColor: "#d4af37", stock: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 4: Bougie Parfumée en Cristal Ciselé
  const p4 = await db.product.create({
    data: {
      name: "Bougie d'Ambiance en Cristal Ciselé",
      slug: "bougie-cristal-cisele",
      sku: "CB-CANDLE-04",
      price: 2800,
      comparePrice: 3500,
      costPrice: 1100,
      stock: 22,
      trackStock: true,
      featured: false,
      active: true,
      categoryId: catCoffrets.id,
      shortDescription: "Cire 100% végétale dans un verre ciselé haut de gamme à bordure dorée. Diffusion longue durée.",
      description: `Créez une atmosphère chaleureuse et raffinée dans votre intérieur.

- Verre en cristal strié haut de gamme réutilisable comme verre décoratif ou photophore
- Cire de soja naturelle pure avec mèche en coton sans plomb
- Combustion propre jusqu'à 55 heures de diffusion délicate
- Parfum développé par des maîtres parfumeurs`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-bougie-crystal.jpg", alt: "Bougie en Cristal Ciselé" }]),
      variants: {
        create: [
          {
            name: "Senteur",
            required: true,
            options: {
              create: [
                { label: "Ambre & Vanille Noire", priceModifier: 0, stock: 10 },
                { label: "Fleur de Coton & Musc", priceModifier: 0, stock: 8 },
                { label: "Bois d'Oud Précieux", priceModifier: 300, stock: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 5: Coffret Quartz Rose & Gua Sha
  const p5 = await db.product.create({
    data: {
      name: "Duo Quartz Rose & Gua Sha Sculptant",
      slug: "duo-quartz-rose-gua-sha",
      sku: "CB-ROLLER-05",
      price: 3400,
      comparePrice: 4200,
      costPrice: 1300,
      stock: 15,
      trackStock: true,
      featured: true,
      active: true,
      categoryId: catAccessoires.id,
      shortDescription: "Quartz rose naturel grade A et monture dorée renforcée pour décongestionner et raffermir.",
      description: `Le rituel millénaire de beauté pour une peau visiblement sculptée et détendue.

- Pierre de quartz rose 100% véritable sélectionnée à la main (fraîcheur naturelle)
- Monture robuste en alliage doré silencieuse et résistante à l'eau
- Stimule la micro-circulation, draine les toxines et facilite la pénétration des sérums
- Inclus : Roller double embout + Gua Sha cœur sculptant dans leur boîte velours

Astuce beauté : conservez vos pierres au réfrigérateur pour un effet décongestionnant immédiat le matin.`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-roller-quartz.jpg", alt: "Duo Quartz Rose & Gua Sha" }]),
      variants: {
        create: [
          {
            name: "Coffret",
            required: true,
            options: {
              create: [
                { label: "Duo Roller + Gua Sha", priceModifier: 0, stock: 10 },
                { label: "Duo + Huile de Massage Botanique", priceModifier: 1200, stock: 5 },
              ],
            },
          },
        ],
      },
    },
  });

  // Product 6: Rose Éternelle sous Cloche de Cristal
  const p6 = await db.product.create({
    data: {
      name: "Rose Éternelle sous Cloche de Cristal",
      slug: "rose-eternelle-cloche-cristal",
      sku: "CB-ROSE-06",
      price: 3900,
      comparePrice: 4800,
      costPrice: 1600,
      stock: 4, // low stock badge
      trackStock: true,
      featured: true,
      active: true,
      categoryId: catCoffrets.id,
      shortDescription: "Véritable rose naturelle stabilisée préservée jusqu'à 5 ans sous dôme en cristal soufflé.",
      description: `Le symbole éternel de l'amour et de l'élégance qui ne fane jamais.

- Véritable rose naturelle traitée par stabilisation biologique écologique
- Dôme en cristal soufflé à la bouche avec poignée diamantée
- Socle en bois noble tourné teinté noyer avec micro-paillettes dorées
- Zéro arrosage, zéro entretien : conserve son éclat intact pendant plusieurs années

Attention : stock très limité sur cette pièce artisanale d'exception.`,
      media: JSON.stringify([{ type: "image", url: "/uploads/prod-rose-eternelle.jpg", alt: "Rose Éternelle sous Cloche" }]),
      variants: {
        create: [
          {
            name: "Couleur de la Rose",
            required: true,
            options: {
              create: [
                { label: "Rouge Passion Velours", priceModifier: 0, hexColor: "#990011", stock: 2 },
                { label: "Blanc Neige Céleste", priceModifier: 0, hexColor: "#fdfbf7", stock: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Successfully seeded luxury catalog with real editorial photography!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
