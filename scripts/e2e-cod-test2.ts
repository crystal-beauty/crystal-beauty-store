export {};
/** Supplementary E2E: stop-desk fee (400 DA at Bab Ezzouar), stop-desk rejection at a non-desk commune (Alger Centre), track-by-phone. */
const BASE = "http://localhost:3000";

async function main() {
  // 1. Create a product
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@crystalbeauty.dz", password: "Admin@123" }),
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];

  const prod = await fetch(`${BASE}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "TEST E2E 2", slug: `test-e2e-2-${Date.now()}`, price: 2000, stock: 3, media: [], variants: [] }),
  }).then((r) => r.json());
  const productId = prod.product?.id;

  // 2. STOP_DESK order at Bab Ezzouar (has_stop_desk=1) → 2000 + 400 = 2400
  const r1 = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Test StopDesk", phone: "0661445566", wilayaId: 16, commune: "Bab Ezzouar",
      address: "Lot B12 Bab Ezzouar", deliveryType: "STOP_DESK",
      items: [{ productId, quantity: 1, selections: {}, giftBox: false }],
    }),
  }).then((r) => r.json());
  console.log("STOP_DESK @ Bab Ezzouar →", JSON.stringify(r1), r1.total === 2400 ? "✓ (2000 + 400 stopdesk fee)" : "⚠️ unexpected");

  // 3. STOP_DESK at Alger Centre (has_stop_desk=0) → must be rejected
  const r2 = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Test Reject", phone: "0776445566", wilayaId: 16, commune: "Alger Centre",
      address: "Rue Didouche Mourad", deliveryType: "STOP_DESK",
      items: [{ productId, quantity: 1, selections: {}, giftBox: false }],
    }),
  }).then((r) => r.json());
  console.log("STOP_DESK @ Alger Centre →", r2.error ? `✓ rejected: ${r2.error}` : `⚠️ NOT rejected: ${JSON.stringify(r2)}`);

  // 4. Track by phone + order number (first order)
  if (r1.orderNumber) {
    const r3 = await fetch(`${BASE}/api/orders/track?orderNumber=${r1.orderNumber}&phone=0661445566`).then((r) => r.json());
    console.log("Track by phone+number →", r3.order ? `✓ ${r3.order.orderNumber} status=${r3.order.status} total=${r3.order.total}` : "⚠️ not found");
    const r4 = await fetch(`${BASE}/api/orders/track?orderNumber=${r1.orderNumber}&phone=0699000000`).then((r) => r.json());
    console.log("Track with wrong phone →", r4.error === "NOT_FOUND" ? "✓ correctly rejected" : `⚠️ ${JSON.stringify(r4)}`);
  }

  // 5. Cleanup
  const list = await fetch(`${BASE}/api/admin/orders`, { headers: { Cookie: cookie } }).then((r) => r.json());
  for (const o of (list.orders || []).filter((o) => o.customerName.startsWith("Test "))) {
    await fetch(`${BASE}/api/admin/orders/${o.id}`, { method: "DELETE", headers: { Cookie: cookie } });
  }
  await fetch(`${BASE}/api/admin/products/${productId}`, { method: "DELETE", headers: { Cookie: cookie } });
  console.log("cleanup done ✓");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
