import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Starting catalog migration to authentic Crystal Beauty products...");

  // 1. Delete old variants & products
  console.log("Clearing existing dummy products and options...");
  await db.variantOption.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  // 2. Create the 3 categories
  console.log("Creating categories...");
  const catLampes = await db.category.create({
    data: {
      name: "Lampes & Décoration Féerique",
      slug: "lampes-decoration",
      description: "Lampes miroirs nuage, coquillages lumineux et veilleuses féeriques pour une ambiance chaleureuse.",
      image: "/images/cloud-tulip-lamp.jpg",
      sortOrder: 1,
      active: true,
    },
  });

  const catBoules = await db.category.create({
    data: {
      name: "Boules de Cristal & Neige",
      slug: "boules-cristal",
      description: "Boules lumineuses féeriques Hello Kitty et Kuromi aux reflets scintillants et flocons magiques.",
      image: "/images/crystal-globe-on.jpg",
      sortOrder: 2,
      active: true,
    },
  });

  const catHorloges = await db.category.create({
    data: {
      name: "Horloges & Objets Rétro",
      slug: "horloges-retro",
      description: "Horloges de table vintage raffinées et pièces décoratives intemporelles pour sublimer votre intérieur.",
      image: "/images/vintage-desk-clock.jpg",
      sortOrder: 3,
      active: true,
    },
  });

  // 3. Define products
  const productsData = [
    {
      slug: "snow-globe-9tbhd",
      name: "Boule à Neige Féerique Kuromi",
      shortDescription: "Éclairage féerique doux, flocons scintillants et socle pastel.",
      description: "✨ Boule à Neige Féerique Kuromi 🔮💜\nApportez une touche de pure magie à votre espace avec cette boule à neige Kuromi ! Éclairage doux et chaleureux, délicats flocons scintillants en suspension et socle pastel raffiné 🌸❄️\n🎀 Le cadeau idéal et plein d'émotion pour vous ou vos proches.\n🚚 Paiement à la livraison disponible sur l'ensemble des 58 Wilayas 📦💫",
      price: 2400,
      comparePrice: 3500,
      stock: 25,
      featured: true,
      categoryId: catBoules.id,
      media: JSON.stringify([
        { type: "image", url: "/images/crystal-globe-on.jpg", alt: "Boule à Neige Féerique Kuromi allumée" },
        { type: "image", url: "/images/crystal-globe-off.jpg", alt: "Boule à Neige Féerique Kuromi lumière du jour" },
        { type: "image", url: "/images/crystal-globe-giftbox.jpg", alt: "Coffret Cadeau Signature Kuromi" },
      ]),
      variants: [
        {
          name: "Présentation & Lumière",
          options: [
            { label: "Allumé (Ambiance Chaleureuse)", priceModifier: 0, stock: 15 },
            { label: "Lumière du Jour (Éteint)", priceModifier: 0, stock: 5 },
            { label: "Coffret Cadeau Signature", priceModifier: 0, stock: 5 },
          ],
        },
      ],
    },
    {
      slug: "hello-kitty-moyenne-0xgxx",
      name: "Boule de Cristal Hello Kitty Lumineuse",
      shortDescription: "Lueur magique chaleureuse, gourmandise pastel et neige scintillante.",
      description: "✨ Boule de Cristal Hello Kitty Lumineuse 🔮🍓\nAjoutez une douce touche d'émerveillement à votre intérieur avec cette boule de cristal Hello Kitty ! Dotée d'une lueur magique chaleureuse, de petits détails fruités et d'un tourbillon de neige féerique 🧁❄️\n🎀 Le cadeau parfait et adorable pour tous les amoureux de Hello Kitty.\n🚚 Livraison rapide sur 58 Wilayas · Paiement à la livraison 📦💫",
      price: 1600,
      comparePrice: 2200,
      stock: 30,
      featured: true,
      categoryId: catBoules.id,
      media: JSON.stringify([
        { type: "image", url: "/images/hello-kitty-moyenne.jpg", alt: "Boule de Cristal Hello Kitty Lumineuse" },
        { type: "image", url: "/images/real-giftbox-navy.jpg", alt: "Dans son écrin luxe navy" },
      ]),
      variants: [
        {
          name: "Écrin & Présentation",
          options: [
            { label: "Création originale", priceModifier: 0, stock: 20 },
            { label: "Dans son écrin luxe", priceModifier: 0, stock: 10 },
          ],
        },
      ],
    },
    {
      slug: "hello-kitty-large-9wec5",
      name: "Boule de Cristal Hello Kitty Grand Modèle",
      shortDescription: "Grand dôme de cristal d'exception avec éclairage féerique scintillant.",
      description: "✨ Boule de Cristal Hello Kitty Grand Modèle 🔮🍓\nUne création d'exception pour illuminer votre intérieur : grand dôme de cristal abritant Hello Kitty dans un décor enchanté, sublimé par des jeux de lumière chaleureux et une féerie de neige scintillante 🧁❄️\n🎀 La pièce maîtresse idéale à offrir ou à exposer fièrement.\n🚚 Expédition soignée sur les 58 Wilayas avec paiement à la réception 📦💫",
      price: 2400,
      comparePrice: 3400,
      stock: 25,
      featured: true,
      categoryId: catBoules.id,
      media: JSON.stringify([
        { type: "image", url: "/images/hello-kitty-large.jpg", alt: "Boule de Cristal Hello Kitty Grand Modèle" },
        { type: "image", url: "/images/real-giftbox-navy.jpg", alt: "Dans son écrin luxe navy" },
      ]),
      variants: [
        {
          name: "Écrin & Présentation",
          options: [
            { label: "Création originale", priceModifier: 0, stock: 15 },
            { label: "Dans son écrin luxe", priceModifier: 0, stock: 10 },
          ],
        },
      ],
    },
    {
      slug: "cloud-tulip-infinity-mirror-lamp-0rema",
      name: "Lampe Miroir Infini Nuage Tulipes",
      shortDescription: "Miroir élégant le jour, champ infini de tulipes lumineuses la nuit.",
      description: "✨ Lampe Miroir Infini Nuage ☁️🌷\nMiroir design le jour, il se transforme d'un simple clic en un jardin infini de tulipes lumineuses grâce à son illusion d'optique captivante 🌷💫\n🎀 L'accessoire de décoration le plus poétique et viral pour créer une atmosphère apaisante.\n🚚 Expédition rapide sur toute l'Algérie (58 wilayas) · Paiement à la livraison 📦✨",
      price: 1900,
      comparePrice: 2800,
      stock: 35,
      featured: true,
      categoryId: catLampes.id,
      media: JSON.stringify([
        { type: "image", url: "/images/cloud-tulip-lamp.jpg", alt: "Lampe Miroir Infini Nuage Tulipes allumée" },
        { type: "image", url: "/images/real-giftbox-navy.jpg", alt: "Dans son écrin luxe navy" },
      ]),
      variants: [
        {
          name: "Écrin & Présentation",
          options: [
            { label: "Création originale", priceModifier: 0, stock: 25 },
            { label: "Dans son écrin luxe", priceModifier: 0, stock: 10 },
          ],
        },
      ],
    },
    {
      slug: "vintage-pedestal-desk-clock-vumvn",
      name: "Horloge de Table Rétro Chic",
      shortDescription: "Design rétro chic avec cadran soigné et piètement vintage.",
      description: "✨ Horloge de Table Rétro Chic 🕰️🤍\nApportez une note d'élégance vintage et intemporelle à votre bureau ou table de nuit. Cadran précis, lignes épurées et finition soignée 💫\n🎀 Le cadeau raffiné et durable pour sublimer tout espace de vie ou de travail.\n🚚 Livraison express sur les 58 Wilayas · Paiement à la livraison 📦",
      price: 1700,
      comparePrice: 2500,
      stock: 20,
      featured: true,
      categoryId: catHorloges.id,
      media: JSON.stringify([
        { type: "image", url: "/images/vintage-desk-clock.jpg", alt: "Horloge de Table Rétro Chic" },
        { type: "image", url: "/images/real-giftbox-navy.jpg", alt: "Dans son écrin luxe navy" },
      ]),
      variants: [
        {
          name: "Écrin & Présentation",
          options: [
            { label: "Création originale", priceModifier: 0, stock: 15 },
            { label: "Dans son écrin luxe", priceModifier: 0, stock: 5 },
          ],
        },
      ],
    },
    {
      slug: "glowing-tulip-seashell-lamp-cigin",
      name: "Lampe Coquillage Tulipes Lumineuses",
      shortDescription: "Coquillage nacré s'ouvrant sur un bouquet de tulipes lumineuses.",
      description: "✨ Lampe Coquillage Tulipes Lumineuses 🐚💛\nUn coquillage nacré aux reflets scintillants qui révèle en son cœur un bouquet de tulipes lumineuses à la lueur douce et relaxante 🌷✨\n🎀 Une pièce d'art décorative féerique pour sublimer votre coiffeuse ou table de chevet.\n🚚 Livraison disponible sur les 58 Wilayas · Paiement à la livraison 📦💫",
      price: 1700,
      comparePrice: 2500,
      stock: 25,
      featured: true,
      categoryId: catLampes.id,
      media: JSON.stringify([
        { type: "image", url: "/images/glowing-tulip-seashell.jpg", alt: "Lampe Coquillage Tulipes Lumineuses" },
        { type: "image", url: "/images/real-giftbox-navy.jpg", alt: "Dans son écrin luxe navy" },
      ]),
      variants: [
        {
          name: "Écrin & Présentation",
          options: [
            { label: "Création originale", priceModifier: 0, stock: 18 },
            { label: "Dans son écrin luxe", priceModifier: 0, stock: 7 },
          ],
        },
      ],
    },
  ];

  for (const item of productsData) {
    const { variants, ...prodData } = item;
    const createdProduct = await db.product.create({
      data: {
        ...prodData,
        weightGrams: 500,
        active: true,
      },
    });

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const createdVariant = await db.variant.create({
        data: {
          productId: createdProduct.id,
          name: v.name,
          required: true,
          sortOrder: i,
        },
      });

      for (let j = 0; j < v.options.length; j++) {
        const opt = v.options[j];
        await db.variantOption.create({
          data: {
            variantId: createdVariant.id,
            label: opt.label,
            priceModifier: opt.priceModifier,
            stock: opt.stock,
            sortOrder: j,
          },
        });
      }
    }
    console.log(`Created: ${createdProduct.name} (${createdProduct.slug})`);
  }

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
