"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Lock, Gift, Banknote, Tag, AlertTriangle, Truck } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, isValidDzMobile, toInternationalDz } from "@/lib/format";
import { trackPixel } from "@/lib/pixel";
import { useLang, useT } from "@/components/store/locale-provider";
import DeliverySelector, { emptyDelivery, type DeliveryValue } from "@/components/store/delivery-selector";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLocalizedProductName, getLocalizedVariantName, getLocalizedVariantOptionLabel } from "@/lib/catalog-i18n";

export default function CheckoutView({ whatsappNumber }: { whatsappNumber: string }) {
  const router = useRouter();
  const settings = useSettings();
  const lang = useLang();
  const t = useT();
  const { items, clear } = useCart();
  const subtotal = cartSubtotal(items);

  // ---- form state ----
  const [form, setForm] = useState({
    customerName: "", email: "", phone: "", phone2: "", address: "",
    notes: "", giftMessage: "", recipientName: "", recipientPhone: "",
  });
  const [delivery, setDelivery] = useState<DeliveryValue>(emptyDelivery);
  const [fee, setFee] = useState<number | null>(null);
  const [feeState, setFeeState] = useState<"idle" | "loading" | "error">("idle");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const giftBoxCount = items.filter((i) => i.giftBox).reduce((n, i) => n + i.quantity, 0);
  const giftBoxFee = giftBoxCount * settings.giftBoxFee;

  const total = useMemo(() => {
    if (fee === null) return null;
    return Math.max(0, Math.round(subtotal - (promo?.discount || 0) + fee + giftBoxFee));
  }, [subtotal, promo, fee, giftBoxFee]);

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
        toast.success(`${t("promoApplied")} — ${data.code} (-${formatMoney(data.discount)})`);
      } else {
        setPromo(null);
        setPromoError(data.error || t("promoInvalid"));
      }
    } catch {
      setPromoError(t("promoInvalid"));
    } finally {
      setPromoChecking(false);
    }
  }

  // ---- submit ----
  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!isValidDzMobile(form.phone)) {
      toast.error(t("phoneInvalid"));
      return;
    }
    if (form.phone2.trim() && !isValidDzMobile(form.phone2)) {
      toast.error(t("phoneInvalid"));
      return;
    }
    if (!delivery.wilayaId || !delivery.commune) {
      toast.error(t("selectBoth"));
      return;
    }
    if (fee === null || feeState !== "idle") {
      toast.error(t("feeError"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone2: form.phone2.trim() || undefined,
          address: delivery.deliveryType === "STOP_DESK" ? (form.address.trim() || "Bureau / Point Relais") : form.address,
          wilayaId: delivery.wilayaId,
          commune: delivery.commune,
          deliveryType: delivery.deliveryType,
          promoCodeStr: promo?.code,
          website: website.trim(),
          startedAt,
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
        toast.error(data.error || t("errorGeneric"));
        setSubmitting(false);
        return;
      }
      trackPixel("AddPaymentInfo", {
        customData: { value: total ?? undefined, currency: "DZD", payment_method: "COD" },
      });
      clear();
      router.push(`/order-confirmation/${data.orderNumber}?event=${encodeURIComponent(data.pixelEventId)}`);
    } catch {
      toast.error(t("errorGeneric"));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-[var(--primary)]">{t("cartEmpty")}</h1>
        <p className="mt-3 text-muted-foreground">{t("cartEmptyCta")}</p>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-all";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-2">{t("checkoutTitle")}</h1>
      <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-[var(--brand)]" /> {t("checkoutSubtitle")}
      </p>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-5 gap-8">
        {/* ============ LEFT: FORM ============ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5 flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold flex items-center justify-center shrink-0" aria-hidden>1</span>
              {t("contactInfo")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="co-name">{t("yourName")} *</label>
                <input id="co-name" required value={form.customerName} onChange={set("customerName")} className={inputCls} placeholder={t("yourName")} />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-phone">{t("yourPhone")} *</label>
                <input
                  id="co-phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="0(5|6|7)[0-9]{8}"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className={cn(inputCls, "tracking-wider")}
                  placeholder="0555 12 34 56"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-phone2">{t("phone2")}</label>
                <input
                  id="co-phone2"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone2}
                  onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className={cn(inputCls, "tracking-wider")}
                  placeholder="06 / 07... (optionnel)"
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5 flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold flex items-center justify-center shrink-0" aria-hidden>2</span>
              {t("deliveryAddress")}
            </h2>
            <DeliverySelector
              value={delivery}
              onChange={setDelivery}
              whatsappNumber={whatsappNumber}
              onFee={(f, s) => {
                setFee(f);
                setFeeState(s);
              }}
            />
            <div className="mt-4">
              <label className={labelCls} htmlFor="co-address">
                {delivery.deliveryType === "STOP_DESK" ? t("addressDeskHint") : t("yourAddress")}
              </label>
              <input
                id="co-address"
                maxLength={30}
                value={form.address}
                onChange={set("address")}
                className={inputCls}
                placeholder={delivery.deliveryType === "STOP_DESK" ? "ex. Bureau central ou point relais (optionnel)" : t("yourAddress")}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {delivery.deliveryType === "STOP_DESK"
                  ? "Votre colis sera acheminé au bureau du transporteur dans votre commune."
                  : `${t("addressHint")} (${form.address.length}/30)`}
              </p>
            </div>
            <div className="mt-4">
              <label className={labelCls} htmlFor="co-notes">{t("optionalNote")}</label>
              <textarea
                id="co-notes"
                value={form.notes}
                onChange={set("notes")}
                rows={2}
                className={inputCls}
                placeholder="Précisions ou instructions utiles pour la livraison..."
              />
            </div>
          </section>

          {/* Gift options */}
          <section className="bg-white rounded-2xl border border-border p-6 shadow-luxe">
            <h2 className="font-display text-lg font-semibold text-[var(--primary)] mb-5 flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold flex items-center justify-center shrink-0" aria-hidden>3</span>
              {t("giftDetails")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="co-recipient">{t("recipientName")}</label>
                <input id="co-recipient" value={form.recipientName} onChange={set("recipientName")} className={inputCls} placeholder={t("recipientHint")} />
              </div>
              <div>
                <label className={labelCls} htmlFor="co-recipient-phone">{t("recipientPhone")}</label>
                <input
                  id="co-recipient-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.recipientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className={cn(inputCls, "tracking-wider")}
                  placeholder="0X XX XX XX XX"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="co-gift">{t("giftMessage")}</label>
                <textarea id="co-gift" value={form.giftMessage} onChange={set("giftMessage")} rows={2} className={inputCls} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{settings.giftBoxDescription}</p>
          </section>
        </div>

        {/* ============ RIGHT: SUMMARY ============ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-luxe lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold text-[var(--primary)] mb-5">{t("orderSummary")}</h2>

            <div className="space-y-4 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {items.map((item) => (
                <div key={item.key} className="flex gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                    <span className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--primary)] truncate">
                      {getLocalizedProductName(item.slug, item.name, lang)}
                    </p>
                    {Object.keys(item.selections).length > 0 && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {Object.entries(item.selections)
                          .map(([k, v]) => `${getLocalizedVariantName(k, lang)}: ${getLocalizedVariantOptionLabel(v, lang)}`)
                          .join(" · ")}
                      </p>
                    )}
                    {item.giftBox && (
                      <p className="text-[11px] text-[var(--brand)] font-medium flex items-center gap-1">
                        <Gift className="h-3 w-3" /> {t("giftBox")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--primary)] whitespace-nowrap">{formatMoney(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Promo */}
            <div className="border-t border-border mt-5 pt-5">
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder={t("promoCode")}
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
                <p className="text-xs text-[var(--primary)] mt-2 flex items-center justify-between">
                  <span>✓ {promo.code}</span>
                  <span>-{formatMoney(promo.discount)}</span>
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border mt-5 pt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-medium text-[var(--primary)]">{formatMoney(subtotal)}</span>
              </div>
              {promo && (
                <div className="flex justify-between text-[var(--primary)]">
                  <span>
                    {t("discount")} ({promo.code})
                  </span>
                  <span>-{formatMoney(promo.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("deliveryFee")}</span>
                <span className="font-medium text-[var(--primary)]">
                  {feeState === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
                  ) : fee !== null ? (
                    formatMoney(fee)
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              {giftBoxFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("giftBox")} ({giftBoxCount})
                  </span>
                  <span className="font-medium text-[var(--primary)]">{formatMoney(giftBoxFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-[var(--primary)]">{t("total")}</span>
                <span className="font-bold text-[var(--primary)]">{total !== null ? formatMoney(total) : "—"}</span>
              </div>
            </div>

            {/* COD notice */}
            <div className="mt-5 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/25 p-4 flex gap-3">
              <Banknote className="h-5 w-5 text-[var(--brand)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{t("codOnly")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("codOnlyHint")}</p>
              </div>
            </div>

            {/* Honeypot field - invisible to humans, catches bots */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ display: "none" }}
              aria-hidden="true"
            />

            <button
              type="submit"
              disabled={submitting || fee === null || feeState !== "idle"}
              className="press mt-5 w-full inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-white font-semibold py-4 rounded-full hover:bg-[#16305c] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> {t("orderPlacing")}
                </>
              ) : total !== null ? (
                <>
                  <ShieldCheck className="h-4.5 w-4.5" /> {t("confirmOrderBtn")} {formatMoney(total)} {t("onDelivery")}
                </>
              ) : (
                t("confirmOrder")
              )}
            </button>
            {feeState === "error" && (
              <p className="mt-3 text-xs text-muted-foreground bg-muted/60 border border-border rounded-xl px-3 py-2.5 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--brand)]" />
                {t("feeError")}
              </p>
            )}

            {/* Legal Consent & Consumer Protection Notice (Loi 18-05 & 18-07 ANPDP) */}
            <div className="mt-4 p-4 rounded-2xl bg-[#F6F4F0] border border-[#E5DFD7] text-[11px] leading-relaxed text-[#3D3A38]">
              <div className="flex items-center gap-1.5 mb-1.5 text-[var(--primary)] font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-[var(--brand)] shrink-0" />
                <span>{t("legalNoticeTitle")}</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground leading-normal">
                {t("legalNoticeBinding")}{" "}
                <a
                  href="/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] font-medium underline underline-offset-2 hover:text-[var(--primary)]"
                >
                  {t("legalNoticeCgv")} &amp; {t("legalNoticePrivacy")}
                </a>.
              </p>
              <div className="mt-2.5 pt-2 border-t border-[#E5DFD7] flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  {t("legalDataProtected")}
                </span>
                <span className="flex items-center gap-1 font-semibold text-[var(--primary)]">
                  <Truck className="h-3 w-3 text-[var(--brand)]" />
                  {t("legalCodBadge")}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground text-center leading-relaxed">{t("agreeCod")}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
