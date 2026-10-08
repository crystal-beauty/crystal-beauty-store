import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { generateOrderNumber } from "@/lib/format";
import { relayMetaEvent } from "@/lib/capi";

interface IncomingItem {
  productId: string;
  quantity: number;
  selections: Record<string, string>;
  giftBox: boolean;
}

// Create order — server recomputes ALL prices (strong backend, never trusts client totals)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, email, phone, country, city, address, postalCode,
      notes, giftMessage, items, promoCodeStr, shippingRateId, paymentMethod,
    } = body || {};

    // ---- validation ----
    if (!customerName?.trim() || !email?.trim() || !phone?.trim() || !country?.trim() || !city?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    const settings = await getSettings();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // ---- items + server-side pricing ----
    const productIds = items.map((i: IncomingItem) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { variants: { include: { options: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let giftBoxCount = 0;
    const orderItems: {
      productId: string; productName: string; productImage: string;
      variantSelections: string; unitPrice: number; quantity: number; lineTotal: number; giftBox: boolean;
    }[] = [];

    for (const raw of items as IncomingItem[]) {
      const product = productMap.get(raw.productId);
      if (!product) return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 400 });
      const qty = Math.max(1, Math.min(99, parseInt(String(raw.quantity)) || 1));
      if (product.trackStock && product.stock < qty) {
        return NextResponse.json({ error: `Only ${product.stock} left of "${product.name}".` }, { status: 400 });
      }
      // variant price modifiers
      let unitPrice = product.price;
      const validSelections: Record<string, string> = {};
      for (const variant of product.variants) {
        const chosen = raw.selections?.[variant.name];
        if (!chosen) {
          if (variant.required) {
            return NextResponse.json({ error: `Please choose a ${variant.name} for "${product.name}".` }, { status: 400 });
          }
          continue;
        }
        const option = variant.options.find((o) => o.label === chosen);
        if (!option) {
          return NextResponse.json({ error: `Invalid option "${chosen}" for ${variant.name}.` }, { status: 400 });
        }
        unitPrice += option.priceModifier;
        validSelections[variant.name] = chosen;
      }
      const giftBox = Boolean(raw.giftBox) && settings.giftBoxEnabled;
      if (giftBox) giftBoxCount += qty;
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineTotal;
      const media = JSON.parse(product.media || "[]");
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: media[0]?.url || "",
        variantSelections: JSON.stringify(validSelections),
        unitPrice: Math.round(unitPrice * 100) / 100,
        quantity: qty,
        lineTotal,
        giftBox,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // ---- gift box fee ----
    const giftBoxFee = settings.giftBoxEnabled ? Math.round(giftBoxCount * settings.giftBoxFee * 100) / 100 : 0;

    // ---- promo code ----
    let discount = 0;
    let promoCodeId: string | undefined;
    let appliedCode: string | null = null;
    if (promoCodeStr?.trim()) {
      const code = promoCodeStr.trim().toUpperCase();
      const promo = await db.promoCode.findUnique({ where: { code } });
      const now = new Date();
      if (promo && promo.active && (!promo.expiresAt || promo.expiresAt > now) && (!promo.maxUses || promo.usedCount < promo.maxUses) && subtotal >= promo.minOrder) {
        discount = promo.type === "PERCENT" ? Math.round(subtotal * (promo.value / 100) * 100) / 100 : Math.min(promo.value, subtotal);
        promoCodeId = promo.id;
        appliedCode = promo.code;
      } else {
        return NextResponse.json({ error: "Promo code is invalid, expired, or does not meet the minimum order." }, { status: 400 });
      }
    }

    // ---- shipping (World Express rates) ----
    let shippingFee = 0;
    let shippingMethodName = "";
    if (shippingRateId) {
      const rate = await db.shippingRate.findFirst({ where: { id: shippingRateId, active: true } });
      if (!rate) return NextResponse.json({ error: "Selected shipping method is unavailable." }, { status: 400 });
      shippingFee = rate.price;
      shippingMethodName = `${rate.carrier} — ${rate.name}`;
    } else {
      return NextResponse.json({ error: "Please choose a shipping method." }, { status: 400 });
    }
    if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    }

    const total = Math.round((subtotal - discount + shippingFee + giftBoxFee) * 100) / 100;

    // ---- create ----
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim(),
        address: address.trim(),
        postalCode: postalCode?.trim() || null,
        notes: notes?.trim() || null,
        giftMessage: giftMessage?.trim() || null,
        subtotal,
        discount,
        shippingFee,
        giftBoxFee,
        total,
        currency: settings.currencyCode,
        promoCodeId,
        promoCodeStr: appliedCode,
        shippingMethodName,
        paymentMethod: paymentMethod === "BANK_TRANSFER" && settings.bankTransferEnabled ? "BANK_TRANSFER" : "COD",
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // ---- side effects ----
    for (const item of orderItems) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    if (promoCodeId) {
      await db.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
    }

    // ---- server-side Meta Conversions API: Purchase event ----
    const pixelEventId = `order_${order.id}`;
    try {
      await relayMetaEvent(
        {
          eventName: "Purchase",
          eventId: pixelEventId,
          source: "server",
          customData: {
            value: total,
            currency: settings.currencyCode,
            contents: orderItems.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.unitPrice })),
            num_items: orderItems.reduce((n, i) => n + i.quantity, 0),
            order_id: order.orderNumber,
          },
          userData: { email, phone, firstName: customerName.split(" ")[0], city, country },
        },
        settings
      );
    } catch {
      // never block an order because of tracking
    }

    return NextResponse.json({ orderNumber: order.orderNumber, total, pixelEventId });
  } catch (e) {
    console.error("Order creation error:", e);
    return NextResponse.json({ error: "Something went wrong placing your order. Please try again." }, { status: 500 });
  }
}
