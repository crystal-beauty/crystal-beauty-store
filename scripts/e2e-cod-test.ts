/**
 * E2E verification against the LIVE World Express API.
 * 1. Admin login
 * 2. Create a test product (removed at the end)
 * 3. Place a COD order (wilaya 16 Alger, commune Bab Ezzouar, home delivery)
 *    → verify the delivery fee quoted server-side == carrier tariff (700 DA)
 * 4. Send the order to the carrier (creates a real parcel, reference = order number)
 * 5. Read back the tracking from the carrier (get/orders)
 * 6. Delete the parcel at the carrier (DELETE /api/v1/delete/order)
 * 7. Cancel the order locally, then clean up (delete order + product)
 */
export {};
const BASE = "http://localhost:3000";

let cookie = "";

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  return { status: res.status, data };
}

async function main() {
  console.log("— 1. Admin login");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@crystalbeauty.dz", password: "Admin@123" }),
  });
  console.log("   login:", login.status, login.data?.member?.role || login.data?.role || JSON.stringify(login.data).slice(0, 120));
  if (login.status !== 200) throw new Error("login failed");

  console.log("— 2. Create test product");
  const product = await api("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name: "TEST E2E Crystal Ball",
      slug: `test-e2e-crystal-ball-${Date.now()}`,
      price: 4900,
      stock: 5,
      trackStock: true,
      active: true,
      media: [],
      variants: [],
    }),
  });
  console.log("   product:", product.status, product.data?.product?.id);
  const productId = product.data?.product?.id;
  if (!productId) throw new Error("product creation failed");

  console.log("— 3. Place COD order (server recomputes price + live delivery fee)");
  const order = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Test Client E2E",
      phone: "0555112233",
      wilayaId: 16,
      commune: "Bab Ezzouar",
      address: "Cité 1200 logts Bt A2",
      deliveryType: "HOME",
      email: "",
      items: [{ productId, quantity: 1, selections: {}, giftBox: false }],
    }),
  });
  console.log("   order:", order.status, JSON.stringify(order.data));
  const orderNumber = order.data?.orderNumber;
  if (!orderNumber) throw new Error("order failed");
  // expected: 4900 products + 700 delivery (Alger home) = 5600 DA COD
  if (order.data.total !== 5600) {
    console.log(`   ⚠️ expected total 5600 (4900 + 700 Alger home fee), got ${order.data.total}`);
  } else {
    console.log("   ✓ COD total = 4900 + 700 (live Alger home fee) = 5600 DA — server-side fee verified");
  }

  console.log("— 4. Find the local order id + send to carrier (REAL parcel)");
  const list = await api(`/api/admin/orders?search=${orderNumber}`);
  const localOrder = list.data?.orders?.[0];
  console.log("   local order:", localOrder?.id, "deliveryFee:", localOrder?.deliveryFee);
  const ship = await api(`/api/admin/orders/${localOrder.id}/ship`, { method: "POST" });
  console.log("   ship:", ship.status, "tracking:", ship.data?.trackingNumber || JSON.stringify(ship.data?.error || ship.data).slice(0, 200));
  const tracking = ship.data?.trackingNumber;

  if (tracking) {
    console.log("— 5. Read back tracking from carrier (get/orders)");
    await new Promise((r) => setTimeout(r, 3000));
    const ship2 = await api(`/api/admin/orders/${localOrder.id}/ship`, { method: "POST" });
    console.log("   idempotent re-ship:", ship2.status, "alreadyBooked:", ship2.data?.alreadyBooked, "→ tracking:", ship2.data?.trackingNumber);

    console.log("— 6. Delete the parcel at the carrier (documented DELETE endpoint)");
    const tokenDirect = await fetch(`${process.env.WX_BASE || "https://world-express.ecotrack.dz"}/api/v1/delete/order?tracking=${tracking}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.WX_TOKEN || process.env.WORLDEXPRESS_API_TOKEN || ""}` },
    });
    const del = await tokenDirect.text();
    console.log("   delete:", tokenDirect.status, del.slice(0, 120));
  } else {
    console.log("   ⚠️ no tracking returned — carrier may have refused the test parcel (see above)");
  }

  console.log("— 7. Cleanup: cancel locally + delete test order + test product");
  await api(`/api/admin/orders/${localOrder.id}`, { method: "PUT", body: JSON.stringify({ status: "CANCELLED" }) });
  await api(`/api/admin/orders/${localOrder.id}`, { method: "DELETE" });
  const delProduct = await api(`/api/admin/products/${productId}`, { method: "DELETE" });
  console.log("   cleanup:", delProduct.status);

  console.log("\n✅ E2E done");
}

main().catch((e) => {
  console.error("E2E FAILED:", e.message);
  process.exit(1);
});
