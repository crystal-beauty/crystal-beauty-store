import { db } from "../src/lib/db";

async function main() {
  console.log("=== 1. VERIFYING PRODUCTS & VARIANTS IN DATABASE ===");
  const products = await db.product.findMany({
    include: {
      variants: {
        include: { options: true },
      },
    },
  });

  if (products.length === 0) {
    throw new Error("No products found in DB!");
  }

  for (const p of products) {
    console.log(`\n• Product: ${p.name} (${p.slug})`);
    console.log(`  Base Price: ${p.price} DZD | Stock: ${p.stock}`);
    if (p.variants.length === 0) {
      console.log(`  Variants: None`);
    } else {
      for (const v of p.variants) {
        console.log(`  Variant Group: "${v.name}" (Required: ${v.required})`);
        for (const opt of v.options) {
          console.log(`    - Option: "${opt.label}" (Price modifier: ${opt.priceModifier >= 0 ? "+" : ""}${opt.priceModifier} DZD)`);
        }
      }
    }
  }

  console.log("\n=== 2. TESTING ORDER SUBMISSION VIA POST /api/orders ===");

  // Find a product with variants
  const serum = products.find((p) => p.slug === "serum-anti-age-crystal-elixir");
  if (!serum) throw new Error("Serum product not found!");
  const variant = serum.variants[0];
  if (!variant || variant.options.length < 2) {
    throw new Error("Expected serum to have variants with at least 2 options!");
  }

  const chosenOption = variant.options[1]; // Pick 2nd option (e.g., 50ml)
  console.log(`Testing with product: "${serum.name}", variant "${variant.name}" = "${chosenOption.label}"`);

  // Test 2A: Quick Order with Stop Desk & Phone2 (Wilaya 16 - Alger, Commune: Bab Ezzouar)
  console.log("\n--- TEST 2A: Quick Order with Stop Desk & Secondary Phone (phone2) ---");
  const quickOrderPayload = {
    customerName: "Amina Benali",
    phone: "0550123456",
    phone2: "0770987654",
    wilayaId: 16,
    commune: "Bab Ezzouar",
    address: "", // Empty address allowed for Stop Desk
    deliveryType: "STOP_DESK",
    items: [
      {
        productId: serum.id,
        quantity: 1,
        selections: {
          [variant.name]: chosenOption.label,
        },
        giftBox: false,
      },
    ],
  };

  const res1 = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quickOrderPayload),
  });

  const data1 = await res1.json();
  console.log("Status:", res1.status, data1);
  if (!res1.ok) {
    throw new Error(`Order 1 failed: ${JSON.stringify(data1)}`);
  }

  // Verify in DB
  const order1 = await db.order.findUnique({
    where: { orderNumber: data1.orderNumber },
    include: { items: true },
  });

  if (!order1) throw new Error("Order 1 not found in database!");
  console.log("Order 1 DB Record verified:");
  console.log(`  Order Number: ${order1.orderNumber}`);
  console.log(`  Customer: ${order1.customerName} (${order1.phone})`);
  console.log(`  Wilaya: ${order1.wilayaName} | Commune: ${order1.commune}`);
  console.log(`  Delivery Type: ${order1.deliveryType} | Address: "${order1.address}"`);
  console.log(`  Subtotal: ${order1.subtotal} DZD | Delivery Fee: ${order1.deliveryFee} DZD | Total: ${order1.total} DZD`);
  console.log(`  Items Count: ${order1.items.length}`);
  console.log(`  Item 1 Variant Selections:`, order1.items[0].variantSelections);
  console.log(`  Item 1 Unit Price: ${order1.items[0].unitPrice} DZD (Expected: ${serum.price + chosenOption.priceModifier} DZD)`);

  if (order1.items[0].unitPrice !== serum.price + chosenOption.priceModifier) {
    throw new Error(`Price mismatch: got ${order1.items[0].unitPrice}, expected ${serum.price + chosenOption.priceModifier}`);
  }

  // Test 2B: Cart Checkout with Home Delivery (Wilaya 31 - Oran)
  console.log("\n--- TEST 2B: Cart Checkout with Multiple Items and Home Delivery ---");
  const parfum = products.find((p) => p.slug === "eau-de-parfum-etoile-de-minuit") || products[1];
  const parfumVariant = parfum.variants[0];
  const parfumOption = parfumVariant ? parfumVariant.options[0] : null;

  const checkoutPayload = {
    customerName: "Karim Mansouri",
    phone: "0661987654",
    wilayaId: 31,
    commune: "Oran",
    address: "14 Rue Larbi Ben M'hidi",
    deliveryType: "HOME",
    items: [
      {
        productId: serum.id,
        quantity: 2,
        selections: {
          [variant.name]: variant.options[0].label,
        },
        giftBox: true,
      },
      {
        productId: parfum.id,
        quantity: 1,
        selections: parfumVariant && parfumOption ? { [parfumVariant.name]: parfumOption.label } : {},
        giftBox: false,
      },
    ],
  };

  const res2 = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutPayload),
  });

  const data2 = await res2.json();
  console.log("Status:", res2.status, data2);
  if (!res2.ok) {
    throw new Error(`Order 2 failed: ${JSON.stringify(data2)}`);
  }

  const order2 = await db.order.findUnique({
    where: { orderNumber: data2.orderNumber },
    include: { items: true },
  });

  if (!order2) throw new Error("Order 2 not found in database!");
  console.log("Order 2 DB Record verified:");
  console.log(`  Order Number: ${order2.orderNumber}`);
  console.log(`  Delivery Type: ${order2.deliveryType} | Address: "${order2.address}"`);
  console.log(`  Subtotal: ${order2.subtotal} DZD | Delivery Fee: ${order2.deliveryFee} DZD | Gift Box Fee: ${order2.giftBoxFee} DZD | Total: ${order2.total} DZD`);
  console.log(`  Items Count: ${order2.items.length}`);
  for (const it of order2.items) {
    console.log(`    - ${it.productName} (Qty: ${it.quantity}) [Selections: ${it.variantSelections}] Line Total: ${it.lineTotal} DZD`);
  }

  // Test 2C: Validation Edge Cases
  console.log("\n--- TEST 2C: Validation Error Handling ---");
  // Missing required variant
  const missingVariantPayload = {
    customerName: "Test User",
    phone: "0770112233",
    wilayaId: 16,
    commune: "Alger Centre",
    address: "Rue Didouche Mourad",
    deliveryType: "HOME",
    items: [
      {
        productId: serum.id,
        quantity: 1,
        selections: {}, // Missing required variant!
        giftBox: false,
      },
    ],
  };

  const res3 = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(missingVariantPayload),
  });

  const data3 = await res3.json();
  console.log("Missing Variant Response (Expected 400):", res3.status, data3.error);
  if (res3.status !== 400) {
    throw new Error(`Expected status 400 for missing variant, got ${res3.status}`);
  }

  // Invalid Algerian mobile
  const badPhonePayload = {
    ...missingVariantPayload,
    phone: "0123456789", // Not 05, 06, or 07
    items: [
      {
        productId: serum.id,
        quantity: 1,
        selections: { [variant.name]: variant.options[0].label },
        giftBox: false,
      },
    ],
  };

  const res4 = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(badPhonePayload),
  });

  const data4 = await res4.json();
  console.log("Invalid Phone Response (Expected 400):", res4.status, data4.error);
  if (res4.status !== 400) {
    throw new Error(`Expected status 400 for bad phone, got ${res4.status}`);
  }

  console.log("\n========================================================");
  console.log("🎉 ALL VARIANT, ORDER, PRICING, & VALIDATION TESTS PASSED!");
  console.log("========================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
