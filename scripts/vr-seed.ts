/**
 * TEMPORARY visual-review seed — creates clearly-marked test data
 * so every storefront page can be reviewed with real content.
 * Every row it creates is tagged TEST-VR (visual review) and is
 * removed by scripts/vr-cleanup.ts afterwards. Never runs in prod.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const IMG_BALL = "/uploads/vr-test-crystal-ball.svg";
const IMG_ROSE = "/uploads/vr-test-rose.svg";
const IMG_CAT = "/uploads/vr-test-cat.svg";

async function main() {
  // Clean any previous VR rows first (idempotent)
  await db.product.deleteMany({ where: { sku: { startsWith: "TEST-VR" } } });
  await db.category.deleteMany({ where: { slug: { startsWith: "test-vr" } } });

  const cat1 = await db.category.create({
    data: {
      name: "Boules de cristal",
      slug: "test-vr-cristal",
      description: "Catégorie de test visuel",
      image: IMG_CAT,
      sortOrder: 0,
    },
  });
  const cat2 = await db.category.create({
    data: { name: "Décoration", slug: "test-vr-deco", description: "Catégorie de test visuel", image: IMG_CAT, sortOrder: 1 },
  });

  const p1 = await db.product.create({
    data: {
      name: "Boule de cristal lumineuse",
      slug: "test-vr-boule-cristal",
      sku: "TEST-VR-001",
      shortDescription: "Une boule de cristal élégante qui illumine la pièce — article de test visuel.",
      description:
        "Article de TEST VISUEL. Cette fiche permet de vérifier la galerie, les variantes, le stock et l'ajout au panier. Elle sera supprimée après la revue.",
      price: 4900,
      comparePrice: 6500,
      stock: 12,
      trackStock: true,
      active: true,
      featured: true,
      weightGrams: 700,
      media: JSON.stringify([
        { type: "image", url: IMG_BALL, alt: "Boule de cristal test" },
        { type: "image", url: IMG_ROSE, alt: "Vue alternative test" },
      ]),
      categoryId: cat1.id,
      variants: {
        create: [
          {
            name: "Taille",
            required: true,
            sortOrder: 0,
            options: {
              create: [
                { label: "Petite (8 cm)", priceModifier: 0, stock: 6, sortOrder: 0 },
                { label: "Moyenne (10 cm)", priceModifier: 800, stock: 4, sortOrder: 1 },
                { label: "Grande (15 cm)", priceModifier: 1800, stock: 2, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      name: "Rose éternelle sous cloche",
      slug: "test-vr-rose-eternelle",
      sku: "TEST-VR-002",
      shortDescription: "Rose préservée sous cloche de verre — article de test visuel.",
      description: "Article de TEST VISUEL pour vérifier la fiche produit sans image de variante.",
      price: 3500,
      stock: 2, // low stock → badge "Plus que X"
      trackStock: true,
      active: true,
      featured: true,
      weightGrams: 400,
      media: JSON.stringify([{ type: "image", url: IMG_ROSE, alt: "Rose éternelle test" }]),
      categoryId: cat2.id,
    },
  });

  await db.product.create({
    data: {
      name: "Produit sans image (test fallback)",
      slug: "test-vr-sans-image",
      sku: "TEST-VR-003",
      shortDescription: "Vérifie le rendu quand aucun média n'est téléversé.",
      description: "Article de TEST VISUEL sans média — doit afficher le fallback neutre.",
      price: 2500,
      stock: 30,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 300,
      media: "[]",
      categoryId: cat2.id,
    },
  });

  await db.product.create({
    data: {
      name: "Article en rupture (test)",
      slug: "test-vr-rupture",
      sku: "TEST-VR-004",
      shortDescription: "Vérifie l'état épuisé.",
      description: "Article de TEST VISUEL — stock 0.",
      price: 1990,
      stock: 0,
      trackStock: true,
      active: true,
      featured: false,
      weightGrams: 250,
      media: JSON.stringify([{ type: "image", url: IMG_BALL, alt: "Rupture test" }]),
      categoryId: cat1.id,
    },
  });

  console.log("VR seed OK:", { cat1: cat1.id, cat2: cat2.id, p1: p1.id });
}

main().finally(() => db.$disconnect());
