"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Truck, Tag, Loader2, ShieldCheck, Lock, Gift, Banknote, Landmark } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney } from "@/lib/format";
import { trackPixel } from "@/lib/pixel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RateOption {
  id: string;
  name: string;
  carrier: string;
  price: number;
  estimatedDays: string;
  isFree: boolean;
}

export default function CheckoutView({ countries }: { countries: string[] }) {
  const router = useRouter();
  const settings = useSettings();
  const { items, clear } = useCart();
  const subtotal = cartSubtotal(items);

  // ---- form state ----
  const [form, setForm] = useState({
    customerName: "", email: "", phone: "", country: "", city: "",
    address: "", postalCode: "", notes: "", giftMessage: "",
  });
  const [rates, setRates] = useState<RateOption[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [shippingRateId, setShippingRateId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(settings.codEnabled ? "COD" : "BANK_TRANSFER");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const giftBoxCount = items.filter((i) => i.giftBox).reduce((n, i) => n + i.quantity, 0);
  const giftBoxFee = giftBoxCount * settings.giftBoxFee;

  // ---- shipping rates lookup ----
  useEffect(() => {
    if (!form.country || !form.city.trim()) {
      setRates([]);
      setShippingRateId("");
      return;
    }
    const controller = new AbortController();
    setRatesLoading(true);
    fetch(`/api/shipping/rates?country=${encodeURIComponent(form.country)}&city=${encodeURIComponent(form.city.trim())}&subtotal=${subtotal}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setRates(data.rates || []);
        if (data.rates?.length) setShippingRateId(data.rates[0].id);
        else setShippingRateId("");
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
    return () => controller.abort();
  }, [form.country, form.city, subtotal]);

  const shippingFee = useMemo(() => rates.find((r) => r.id === shippingRateId)?.price ?? 0, [rates, shippingRateId]);
  const total = Math.max(0, subtotal - (promo?.discount || 0) + shippingFee + giftBoxFee);

  // ---- promo ----
  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo({ code: data.code, discount: data.discount });
        toast.success(`Promo code ${data.code} applied — you saved ${formatMoney(data.discount, settings)}!`);
      } else {
        setPromo(null);
        setPromoError(data.error || "This code could not be applied.");
      }
    } catch {
      setPromoError("Could not check the code. Try again.");
    } finally {
      setPromoChecking(false);
    }
  }

  // ---- submit ----
  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!shippingRateId) {
      toast.error("Please choose a shipping method.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          promoCodeStr: promo?.code,
          shippingRateId,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selections: i.selections,
            giftBox: i.giftBox,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not place the order. Please review your details.");
        setSubmitting(false);
        return;
      }
      trackPixel("AddPaymentInfo", {
        customData: { value: total, currency: settings.currencyCode, payment_method: paymentMethod },
      });
      clear();
      router.push(`/order-confirmation/${data.orderNumber}?event=${encodeURIComponent(data.pixelEventId)}`);
    } catch {
      toast.error("Network error — please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-[var(--primary)]">Nothing to check out yet</h1>
        <p className="mt-3 text-muted-foreground">Add a gift to your cart first.</p>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-all";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-[var(--gold)]" /> Secure checkout — your gift is a few clicks away
      </p>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-5 gap-8">
        {/* ============ LEFT: FORM ============ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="co-name">Full Name *</label>
                <input id="co-name" required value={form.customerName} onChange={set("customerName")} className={inputCls} placeholder="Sarah Johnson" />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-email">Email *</label>
                <input id="co-email" required type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="sarah@email.com" />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-phone">Phone / WhatsApp *</label>
                <input id="co-phone" required value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+1 555 000 1234" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Delivery Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="co-country">Country *</label>
                <select id="co-country" required value={form.country} onChange={set("country")} className={inputCls}>
                  <option value="">Select country…</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="co-city">City *</label>
                <input id="co-city" required value={form.city} onChange={set("city")} className={inputCls} placeholder="Dubai" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="co-address">Address *</label>
                <input id="co-address" required value={form.address} onChange={set("address")} className={inputCls} placeholder="Street, building, apartment" />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-postal">Postal Code</label>
                <input id="co-postal" value={form.postalCode} onChange={set("postalCode")} className={inputCls} placeholder="Optional" />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-1.5">Shipping Method</h2>
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[var(--gold)]" /> Worldwide delivery with World Express
            </p>
            {!form.country || !form.city.trim() ? (
              <p className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3.5">
                Enter your country and city to see available shipping options.
              </p>
            ) : ratesLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2 px-1">
                <Loader2 className="h-4 w-4 animate-spin" /> Finding the best routes…
              </p>
            ) : rates.length === 0 ? (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3.5">
                No shipping available to this destination yet. Please contact us and we&apos;ll arrange it.
              </p>
            ) : (
              <div className="space-y-3">
                {rates.map((rate) => (
                  <label
                    key={rate.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all",
                      shippingRateId === rate.id ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]" : "border-input hover:border-[var(--primary)]/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingRateId === rate.id}
                      onChange={() => setShippingRateId(rate.id)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--primary)]">
                        {rate.carrier} — {rate.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Estimated {rate.estimatedDays} days</p>
                    </div>
                    <p className="font-semibold text-[var(--primary)]">
                      {rate.isFree || rate.price === 0 ? (
                        <span className="text-[var(--gold)]">FREE</span>
                      ) : (
                        formatMoney(rate.price, settings)
                      )}
                    </p>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4">Payment</h2>
            <div className="space-y-3">
              {settings.codEnabled && (
                <label
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all",
                    paymentMethod === "COD" ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]" : "border-input hover:border-[var(--primary)]/40"
                  )}
                >
                  <input type="radio" name="payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="h-4 w-4 accent-[var(--primary)]" />
                  <Banknote className="h-5 w-5 text-[var(--gold)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when your gift arrives</p>
                  </div>
                </label>
              )}
              {settings.bankTransferEnabled && (
                <label
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all",
                    paymentMethod === "BANK_TRANSFER" ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]" : "border-input hover:border-[var(--primary)]/40"
                  )}
                >
                  <input type="radio" name="payment" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} className="h-4 w-4 accent-[var(--primary)]" />
                  <Landmark className="h-5 w-5 text-[var(--gold)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">Instructions sent after ordering</p>
                  </div>
                </label>
              )}
            </div>
          </section>

          {/* Extras */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-4 flex items-center gap-2">
              <Gift className="h-4.5 w-4.5 text-[var(--gold)]" /> Gift Details
            </h2>
            <label className={labelCls} htmlFor="co-gift">Gift Message (printed note)</label>
            <textarea
              id="co-gift"
              value={form.giftMessage}
              onChange={set("giftMessage")}
              rows={2}
              className={inputCls}
              placeholder="Happy birthday! We love you. — Alex"
            />
            <label className={cn(labelCls, "mt-4")} htmlFor="co-notes">Order Notes</label>
            <textarea
              id="co-notes"
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              className={inputCls}
              placeholder="Delivery instructions, preferred time…"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              By default your gift is delivered as a single piece. Want it boxed? Add the gift box on the product or cart page.
            </p>
          </section>
        </div>

        {/* ============ RIGHT: SUMMARY ============ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe sticky top-24">
            <h2 className="font-display text-xl font-semibold text-[var(--primary)] mb-5">Your Order</h2>

            <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {items.map((item) => (
                <div key={item.key} className="flex gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                    {item.image ? (
                       
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                    <span className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">{item.name}</p>
                    {Object.keys(item.selections).length > 0 && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {Object.entries(item.selections).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    {item.giftBox && (
                      <p className="text-[11px] text-[var(--gold)] font-medium flex items-center gap-1">
                        <Gift className="h-3 w-3" /> Gift box
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--primary)] whitespace-nowrap">
                    {formatMoney(item.unitPrice * item.quantity, settings)}
                  </p>
                </div>
              ))}
            </div>

            {/* Promo */}
            <div className="border-t border-border mt-5 pt-5">
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  className="flex-1 bg-white border border-input rounded-xl px-3.5 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoChecking}
                  className="bg-muted hover:bg-border text-[var(--primary)] text-sm font-medium px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {promoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                </button>
              </div>
              {promoError && <p className="text-xs text-destructive mt-2">{promoError}</p>}
              {promo && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center justify-between">
                  <span>✓ {promo.code} applied</span>
                  <span>-{formatMoney(promo.discount, settings)}</span>
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border mt-5 pt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-[var(--primary)]">{formatMoney(subtotal, settings)}</span>
              </div>
              {promo && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({promo.code})</span>
                  <span>-{formatMoney(promo.discount, settings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-[var(--primary)]">
                  {rates.length === 0 ? "—" : shippingFee === 0 ? <span className="text-[var(--gold)]">FREE</span> : formatMoney(shippingFee, settings)}
                </span>
              </div>
              {giftBoxFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gift boxes ({giftBoxCount})</span>
                  <span className="font-medium text-[var(--primary)]">{formatMoney(giftBoxFee, settings)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-[var(--primary)]">Total</span>
                <span className="font-bold text-[var(--primary)]">{formatMoney(total, settings)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || rates.length === 0}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-white font-semibold py-4 rounded-full hover:bg-[#b8903a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Placing your order…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4.5 w-4.5" /> Place Order — {formatMoney(total, settings)}
                </>
              )}
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground text-center leading-relaxed">
              By placing this order you agree to our terms. You&apos;ll receive an order number to track your delivery.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
