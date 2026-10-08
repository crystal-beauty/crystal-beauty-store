"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CheckCircle2, Package, Truck, Gift, Home } from "lucide-react";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney } from "@/lib/format";
import { trackPixel } from "@/lib/pixel";

interface OrderData {
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  city: string;
  country: string;
  shippingMethodName: string | null;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  giftBoxFee: number;
  total: number;
  promoCodeStr: string | null;
  createdAt: string;
  items: {
    productName: string;
    productImage: string;
    variantSelections: string;
    quantity: number;
    giftBox: boolean;
    lineTotal: number;
  }[];
}

export default function ConfirmationView({ order, pixelEventId }: { order: OrderData; pixelEventId: string }) {
  const settings = useSettings();
  const fired = useRef(false);

  // Meta Pixel: Purchase — deduplicated via the same eventID used server-side (CAPI)
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPixel("Purchase", {
      eventId: pixelEventId || undefined,
      customData: {
        value: order.total,
        currency: settings.currencyCode,
        contents: order.items.map((i) => ({
          id: i.productName,
          quantity: i.quantity,
          item_price: i.quantity > 0 ? i.lineTotal / i.quantity : i.lineTotal,
        })),
        num_items: order.items.reduce((n, i) => n + i.quantity, 0),
        order_id: order.orderNumber,
      },
      userData: { email: order.email, city: order.city, country: order.country },
    });
     
  }, []);

  const numItems = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Success hero */}
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">
          Thank you, {order.customerName.split(" ")[0]}! 🎁
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Your order <span className="font-semibold text-[var(--primary)]">{order.orderNumber}</span> is confirmed.
          We&apos;ve sent the details to <span className="font-medium">{order.email}</span> and will start preparing your gift right away.
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-10 bg-white rounded-2xl border border-border p-6 shadow-luxe">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium text-[var(--primary)]">
            <Package className="h-4 w-4 text-[var(--gold)]" /> Order placed
          </span>
          <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/4 bg-[var(--gold)] rounded-full" />
        </div>
        <div className="mt-3 grid grid-cols-4 text-[11px] text-muted-foreground">
          <span className="text-[var(--gold)] font-medium">Confirmed</span>
          <span className="text-center">Preparing</span>
          <span className="text-center">Shipped</span>
          <span className="text-right">Delivered</span>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 bg-white rounded-2xl border border-border p-6 shadow-luxe">
        <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">
          Your Gift{numItems > 1 ? "s" : ""} ({numItems})
        </h2>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.productImage && (
                   
                  <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--primary)]">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.variantSelections !== "{}" &&
                    Object.values(JSON.parse(item.variantSelections || "{}")).join(" · ")}
                  {item.giftBox && " · 🎁 Gift box"}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--primary)]">{formatMoney(item.lineTotal, settings)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-5 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, settings)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {order.promoCodeStr && `(${order.promoCodeStr})`}</span>
              <span>-{formatMoney(order.discount, settings)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping {order.shippingMethodName && `— ${order.shippingMethodName}`}</span>
            <span>{order.shippingFee === 0 ? "FREE" : formatMoney(order.shippingFee, settings)}</span>
          </div>
          {order.giftBoxFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> Gift boxes</span>
              <span>{formatMoney(order.giftBoxFee, settings)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 font-semibold text-[var(--primary)]">
            <span>Total ({order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"})</span>
            <span>{formatMoney(order.total, settings)}</span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-6 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-[var(--gold)] mt-0.5 shrink-0" />
          <p className="text-sm text-white/85 leading-relaxed">
            Track your gift anytime using order number{" "}
            <span className="font-semibold text-white">{order.orderNumber}</span> — shipping with World Express.
          </p>
        </div>
        <Link
          href="/track"
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--gold)] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#b8903a] transition-colors"
        >
          Track Order
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--gold)] transition-colors">
          <Home className="h-4 w-4" /> Continue shopping
        </Link>
      </div>
    </div>
  );
}
