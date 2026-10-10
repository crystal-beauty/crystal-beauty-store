"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CheckCircle2, Gift, Home, MessageCircle, Package, Phone, MapPin, Building } from "lucide-react";
import { formatMoney, toInternationalDz } from "@/lib/format";
import { trackPixel } from "@/lib/pixel";
import { useT } from "@/components/store/locale-provider";

interface OrderData {
  orderNumber: string;
  customerName: string;
  phone: string;
  wilayaName: string;
  commune: string;
  deliveryType: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  giftBoxFee: number;
  total: number;
  promoCodeStr: string | null;
  createdAt: string;
  items: {
    productName: string;
    productImage: string | null;
    variantSelections: string;
    quantity: number;
    giftBox: boolean;
    lineTotal: number;
  }[];
}

export default function ConfirmationView({
  order,
  whatsappNumber,
  pixelEventId,
}: {
  order: OrderData;
  whatsappNumber: string;
  pixelEventId: string;
}) {
  const t = useT();
  const fired = useRef(false);

  // Meta Pixel: Purchase — deduplicated via the same eventID used server-side (CAPI)
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPixel("Purchase", {
      eventId: pixelEventId || undefined,
      customData: {
        value: order.total,
        currency: "DZD",
        contents: order.items.map((i) => ({
          id: i.productName,
          quantity: i.quantity,
          item_price: i.quantity > 0 ? i.lineTotal / i.quantity : i.lineTotal,
        })),
        num_items: order.items.reduce((n, i) => n + i.quantity, 0),
        order_id: order.orderNumber,
      },
      userData: { phone: order.phone, city: order.commune, country: "Algeria" },
    });
     
  }, []);

  const waHref = whatsappNumber
    ? `https://wa.me/${toInternationalDz(whatsappNumber).replace("+", "")}?text=${encodeURIComponent(
        `Bonjour, je viens de passer la commande ${order.orderNumber}. / مرحبًا، لقد قمت للتو بطلب ${order.orderNumber}.`
      )}`
    : "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Success hero */}
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-[var(--primary)]" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">{t("thankYouTitle")}</h1>
        <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-[var(--brand)]/40 bg-[var(--brand)]/5 px-8 py-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("thankYouNumber")}</p>
          <p className="font-display text-2xl font-bold text-[var(--primary)] mt-1" dir="ltr">
            {order.orderNumber}
          </p>
        </div>
        <p className="mt-5 text-muted-foreground max-w-lg mx-auto">{t("thankYouContact")}</p>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[#16305c] text-white font-medium px-7 py-3.5 rounded-full transition-colors shadow-lg"
          >
            <MessageCircle className="h-4.5 w-4.5" /> {t("thankYouWhatsapp")}
          </a>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{t("thankYouKeep")}</p>
      </div>

      {/* Summary */}
      <div className="mt-10 bg-white rounded-2xl border border-border p-6 shadow-luxe">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="flex items-center gap-2 font-medium text-[var(--primary)]">
            <Package className="h-4 w-4 text-[var(--brand)]" /> {t("orderSummary")}
          </span>
          <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--primary)]">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.variantSelections !== "{}" &&
                    Object.values(JSON.parse(item.variantSelections || "{}")).join(" · ")}
                  {item.giftBox && ` · ${t("giftBox")}`}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-5 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[var(--primary)]">
              <span>
                {t("discount")} {order.promoCodeStr && `(${order.promoCodeStr})`}
              </span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {order.deliveryType === "STOP_DESK" ? <Building className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {t("deliveryFee")} — {order.commune}, {order.wilayaName}
            </span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </div>
          {order.giftBoxFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" /> {t("giftBox")}
              </span>
              <span>{formatMoney(order.giftBoxFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 font-semibold text-[var(--primary)]">
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-[var(--brand)]" /> {t("payOnDelivery")}
            </span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center flex flex-wrap justify-center gap-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--brand)] transition-colors">
          <Home className="h-4 w-4" /> {t("backHome")}
        </Link>
        <Link href={`/track?order=${order.orderNumber}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--brand)] transition-colors">
          <Package className="h-4 w-4" /> {t("trackThisOrder")}
        </Link>
      </div>
    </div>
  );
}
