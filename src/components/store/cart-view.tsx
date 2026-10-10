"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Gift, ArrowRight, Banknote } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart";
import { useSettings } from "@/components/store/settings-provider";
import { useT } from "@/components/store/locale-provider";
import { formatMoney } from "@/lib/format";
import { trackPixel } from "@/lib/pixel";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function CartView() {
  const { items, removeItem, updateQuantity, toggleGiftBox } = useCart();
  const settings = useSettings();
  const t = useT();
  const subtotal = cartSubtotal(items);
  const giftBoxCount = items.filter((i) => i.giftBox).length;
  const giftBoxFeeTotal = giftBoxCount * settings.giftBoxFee;

  // Meta Pixel: InitiateCheckout on cart view
  useEffect(() => {
    if (items.length > 0) {
      trackPixel("InitiateCheckout", {
        customData: {
          value: subtotal,
          currency: "DZD",
          num_items: items.reduce((n, i) => n + i.quantity, 0),
          content_ids: items.map((i) => i.productId),
        },
      });
    }
     
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="h-14 w-14 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-display text-3xl font-semibold text-[var(--primary)]">{t("cartEmpty")}</h1>
        <Link
          href="/products"
          className="press mt-8 inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold px-8 py-4 rounded-full hover:bg-[var(--primary)]/90 transition-colors"
        >
          {t("cartEmptyCta")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-8">{t("cartTitle")}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="bg-white rounded-2xl border border-border p-5 sm:p-6 flex gap-5 shadow-luxe">
              <Link href={`/product/${item.slug}`} className="shrink-0">
                {/* Square thumbnail — graceful fallback behind the image so broken URLs never look broken */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-muted border border-border/60">
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--primary)]/25">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-display text-lg font-medium text-[var(--primary)] hover:text-[var(--brand)] transition-colors"
                    >
                      {item.name}
                    </Link>
                    {Object.keys(item.selections).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.entries(item.selections).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`${t("remove")} ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Gift box toggle (optional add-on) */}
                {settings.giftBoxEnabled && (
                  <button
                    onClick={() => toggleGiftBox(item.key)}
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition-colors",
                      item.giftBox
                        ? "bg-[var(--brand)]/10 border-[var(--brand)] text-[var(--brand)]"
                        : "bg-muted border-transparent text-muted-foreground hover:text-[var(--primary)]"
                    )}
                  >
                    <Gift className="h-3.5 w-3.5" />
                    {item.giftBox ? `${t("giftBox")} ✓` : `${t("giftBox")} +${formatMoney(settings.giftBoxFee)}`}
                  </button>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center border border-input rounded-lg bg-white">
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-2 text-[var(--primary)] hover:bg-muted" aria-label="-">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-[var(--primary)]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-2 text-[var(--primary)] hover:bg-muted" aria-label="+">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold text-[var(--primary)]">{formatMoney(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-7 shadow-luxe lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold text-[var(--primary)] mb-4">{t("orderSummary")}</h2>
            <div className="divide-y divide-border/70 text-sm">
              <div className="flex justify-between py-3.5">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-semibold text-[var(--primary)]">{formatMoney(subtotal)}</span>
              </div>
              {giftBoxFeeTotal > 0 && (
                <div className="flex justify-between py-3.5">
                  <span className="text-muted-foreground">
                    {t("giftBox")} × {giftBoxCount}
                  </span>
                  <span className="font-semibold text-[var(--primary)]">{formatMoney(giftBoxFeeTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3.5">
                <span className="text-muted-foreground">{t("deliveryFee")}</span>
                <span className="text-muted-foreground text-xs text-end leading-snug max-w-[55%]">{t("selectBoth")}</span>
              </div>
            </div>

            {/* COD reassurance — matches the checkout notice */}
            <div className="mt-4 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/25 p-4 flex gap-3">
              <Banknote className="h-5 w-5 text-[var(--brand)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{t("codOnly")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("codOnlyHint")}</p>
              </div>
            </div>

            <div className="border-t border-border mt-6 pt-6">
              <Link
                href="/checkout"
                className="press w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-4 rounded-full hover:bg-[var(--primary)]/90 transition-colors"
              >
                <Banknote className="h-4 w-4" />
                {t("checkout")}
              </Link>
              <Link
                href="/products"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-border text-[var(--primary)] font-medium py-3.5 rounded-full hover:bg-muted transition-colors text-sm"
              >
                {t("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
