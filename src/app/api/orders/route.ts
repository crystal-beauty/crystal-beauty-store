import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { generateOrderNumber, isValidDzMobile, normalizeDzPhone, wilayaName } from "@/lib/format";
import { getFeeForWilaya, getCommunes } from "@/lib/carrier";
import { relayMetaEvent } from "@/lib/capi";
import {
  isPhoneBlocked,
  checkHoneypot,
  checkFillTime,
  checkName,
  checkPhoneSanity,
  checkOrderRate,
} from "@/lib/order-guard";
import { getLocalizedVariantName, getLocalizedVariantOptionLabel } from "@/lib/catalog-i18n";

interface IncomingItem {
  productId: string;
  quantity: number;
  selections: Record<string, string>;
  giftBox: boolean;
}

// Create COD order — server recomputes ALL prices from the database and quotes
// the delivery fee live from the carrier API. Client totals are never trusted.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, email, phone, phone2, wilayaId, commune, address,
      deliveryType, notes, giftMessage, recipientName, recipientPhone,
      items, promoCodeStr, website, startedAt,
    } = body || {};

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // ---- 1. Anti-bot honeypot check ----
    const honey = checkHoneypot(website);
    if (!honey.ok) {
      return NextResponse.json({ error: honey.error }, { status: 400 });
    }

    // ---- 2. Timing check (scripted speed bot rejection) ----
    const timing = checkFillTime(startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: 429 });
    }

    // ---- 3. Field sanity checks (name & phone) ----
    const nameCheck = checkName(String(customerName || ""));
    if (!nameCheck.ok) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    const phoneCheck = checkPhoneSanity(String(phone || ""));
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    if (phone2?.trim()) {
      const phone2Check = checkPhoneSanity(String(phone2));
      if (!phone2Check.ok) {
        return NextResponse.json({ error: "Numéro de téléphone secondaire : " + phone2Check.error }, { status: 400 });
      }
    }

    // ---- 4. DB-backed velocity & rate limits ----
    const rate = await checkOrderRate(String(phone || ""), ip);
    if (!rate.ok) {
      return NextResponse.json({ error: rate.error }, { status: 429 });
    }

    if (!commune?.trim()) return NextResponse.json({ error: "Veuillez choisir votre commune." }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }
    if (email?.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email.trim())) {
        return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
      }
    }
    if (recipientPhone?.trim() && !isValidDzMobile(String(recipientPhone))) {
      return NextResponse.json({ error: "Téléphone du destinataire invalide (05 / 06 / 07)." }, { status: 400 });
    }
    const wilaya = parseInt(String(wilayaId), 10);
    if (!wilaya || wilaya < 1 || wilaya > 58) {
      return NextResponse.json({ error: "Veuillez choisir votre wilaya." }, { status: 400 });
    }
    const type = deliveryType === "STOP_DESK" ? "STOP_DESK" : "HOME";
    const resolvedAddress = type === "STOP_DESK"
      ? (address?.trim() ? address.trim().slice(0, 30) : "Bureau / Point Relais")
      : (address?.trim() ? address.trim().slice(0, 30) : "Livraison à domicile");

    // ---- blocked phones (polite refusal) ----
    if (await isPhoneBlocked(phone)) {
      return NextResponse.json(
        { error: "Nous ne pouvons pas accepter votre commande pour le moment. Contactez-nous sur WhatsApp si vous pensez qu'il s'agit d'une erreur." },
        { status: 403 }
      );
    }

    const settings = await getSettings();

    // ---- items + server-side pricing (from DB, never the browser) ----
    const productIds = items.map((i: IncomingItem) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { variants: { include: { options: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let giftBoxCount = 0;
    const variantOptionsToDecrement: { optionId: string; qty: number }[] = [];
    const orderItems: {
      productId: string; productName: string; productImage: string;
      variantSelections: string; unitPrice: number; quantity: number; lineTotal: number; giftBox: boolean;
    }[] = [];

    for (const raw of items as IncomingItem[]) {
      const product = productMap.get(raw.productId);
      if (!product) return NextResponse.json({ error: "Un produit de votre panier n'est plus disponible." }, { status: 400 });
      const qty = Math.max(1, Math.min(99, parseInt(String(raw.quantity)) || 1));
      if (product.trackStock && product.stock < qty) {
        return NextResponse.json({ error: `Il ne reste que ${product.stock} unités de « ${product.name} ».` }, { status: 400 });
      }
      let unitPrice = product.price;
      const validSelections: Record<string, string> = {};
      for (const variant of product.variants) {
        const localizedVName = getLocalizedVariantName(variant.name, "ar");
        const chosen = raw.selections?.[variant.name] || raw.selections?.[localizedVName];
        if (!chosen) {
          if (variant.required) {
            return NextResponse.json({ error: `Veuillez choisir « ${variant.name} » pour « ${product.name} ».` }, { status: 400 });
          }
          continue;
        }
        const option = variant.options.find((o) => {
          const locOpt = getLocalizedVariantOptionLabel(o.label, "ar");
          return o.label === chosen || locOpt === chosen;
        });
        if (!option) {
          return NextResponse.json({ error: `Option « ${chosen} » invalide pour ${variant.name}.` }, { status: 400 });
        }
        if (option.stock !== null && option.stock < qty) {
          return NextResponse.json({ error: `Il ne reste que ${option.stock} unités pour l'option « ${option.label} ».` }, { status: 400 });
        }
        if (option.stock !== null) {
          variantOptionsToDecrement.push({ optionId: option.id, qty });
        }
        unitPrice += option.priceModifier;
        validSelections[variant.name] = option.label;
      }
      const giftBox = Boolean(raw.giftBox) && settings.giftBoxEnabled;
      if (giftBox) giftBoxCount += qty;
      const lineTotal = Math.round(unitPrice * qty); // DZD whole numbers
      subtotal += lineTotal;
      const media = JSON.parse(product.media || "[]");
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: media[0]?.url || "",
        variantSelections: JSON.stringify(validSelections),
        unitPrice: Math.round(unitPrice),
        quantity: qty,
        lineTotal,
        giftBox,
      });
    }

    subtotal = Math.round(subtotal);

    // ---- gift box fee ----
    const giftBoxFee = settings.giftBoxEnabled ? Math.round(giftBoxCount * settings.giftBoxFee) : 0;

    // ---- promo code ----
    let discount = 0;
    let promoCodeId: string | undefined;
    let appliedCode: string | null = null;
    if (promoCodeStr?.trim()) {
      const code = promoCodeStr.trim().toUpperCase();
      const promo = await db.promoCode.findUnique({ where: { code } });
      const now = new Date();
      if (promo && promo.active && (!promo.expiresAt || promo.expiresAt > now) && (!promo.maxUses || promo.usedCount < promo.maxUses) && subtotal >= promo.minOrder) {
        discount = promo.type === "PERCENT" ? Math.round(subtotal * (promo.value / 100)) : Math.min(Math.round(promo.value), subtotal);
        promoCodeId = promo.id;
        appliedCode = promo.code;
      } else {
        return NextResponse.json({ error: "Code promo invalide, expiré, ou minimum de commande non atteint." }, { status: 400 });
      }
    }

    // ---- delivery fee: LIVE from the carrier API (no fallback, no estimates) ----
    let deliveryFee: number;
    try {
      const quoted = await getFeeForWilaya(wilaya, type);
      if (quoted === null) {
        return NextResponse.json({ error: "Livraison indisponible dans votre wilaya pour le moment. Contactez-nous sur WhatsApp." }, { status: 400 });
      }
      deliveryFee = quoted;
    } catch {
      return NextResponse.json(
        { error: "Impossible de calculer la livraison. Réessayez ou contactez-nous sur WhatsApp." },
        { status: 502 }
      );
    }

    // ---- validate stop-desk availability in the chosen commune (server-side) ----
    if (type === "STOP_DESK") {
      try {
        const communes = await getCommunes(wilaya);
        const match = communes.find((c) => c.name === commune.trim());
        if (!match) {
          return NextResponse.json({ error: "Commune inconnue pour cette wilaya." }, { status: 400 });
        }
        if (!match.has_stop_desk) {
          return NextResponse.json({ error: "Pas d'arrêt bureau dans cette commune — choisissez la livraison à domicile." }, { status: 400 });
        }
      } catch {
        return NextResponse.json(
          { error: "Impossible de vérifier l'arrêt bureau. Réessayez ou contactez-nous sur WhatsApp." },
          { status: 502 }
        );
      }
    }

    // COD amount collected by the carrier = products + delivery (whole DA)
    const total = Math.round(subtotal - discount + deliveryFee + giftBoxFee);

    // ---- create ----
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: "NEW",
        customerName: customerName.trim(),
        email: email?.trim() || null,
        phone: normalizeDzPhone(phone),
        phone2: phone2?.trim() ? normalizeDzPhone(phone2) : null,
        wilayaId: wilaya,
        wilayaName: wilayaName(wilaya),
        commune: commune.trim(),
        address: resolvedAddress,
        deliveryType: type,
        stopDeskName: type === "STOP_DESK" ? commune.trim() : null,
        notes: notes?.trim() || null,
        giftMessage: giftMessage?.trim() || null,
        recipientName: recipientName?.trim() || null,
        recipientPhone: recipientPhone ? normalizeDzPhone(recipientPhone) : null,
        subtotal,
        discount,
        deliveryFee,
        giftBoxFee,
        total,
        currency: "DZD",
        promoCodeId,
        promoCodeStr: appliedCode,
        customerIp: ip,
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
    for (const { optionId, qty } of variantOptionsToDecrement) {
      await db.variantOption.update({
        where: { id: optionId },
        data: { stock: { decrement: qty } },
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
            currency: "DZD",
            contents: orderItems.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.unitPrice })),
            num_items: orderItems.reduce((n, i) => n + i.quantity, 0),
            order_id: order.orderNumber,
          },
          userData: {
            phone: order.phone,
            firstName: customerName.trim().split(" ")[0],
            city: order.commune,
            country: "Algeria",
          },
        },
        settings
      );
    } catch {
      // never block an order because of tracking
    }

    return NextResponse.json({ orderNumber: order.orderNumber, total, pixelEventId });
  } catch (e) {
    console.error("Order creation error:", e);
    return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer." }, { status: 500 });
  }
}
