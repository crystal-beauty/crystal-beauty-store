"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Gift, Package, Banknote, Truck, PackageSearch, Check, Minus, Plus, Loader2, Star, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { trackPixel } from "@/lib/pixel";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney, isValidDzMobile, toInternationalDz } from "@/lib/format";
import type { MediaItem } from "@/lib/format";
import { useT } from "@/components/store/locale-provider";
import DeliverySelector, { emptyDelivery, type DeliveryValue } from "@/components/store/delivery-selector";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VariantData {
  id: string;
  name: string;
  required: boolean;
  options: { id: string; label: string; priceModifier: number; hexColor: string | null; stock: number | null }[];
}

export interface ProductReview {
  id: string;
  customerName: string;
  wilayaName: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  trackStock: boolean;
  shortDescription: string | null;
  description: string | null;
  media: MediaItem[];
  variants: VariantData[];
}

export default function ProductDetail({
  product,
  giftBox,
  reviews,
  whatsappNumber,
}: {
  product: ProductData;
  giftBox: { enabled: boolean; fee: number; label: string; labelAr: string; description: string; descriptionAr: string };
  reviews: ProductReview[];
  whatsappNumber: string;
}) {
  const router = useRouter();
  const settings = useSettings();
  const t = useT();
  const addItem = useCart((s) => s.addItem);

  const [activeMedia, setActiveMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wantGiftBox, setWantGiftBox] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of product.variants) if (v.required && v.options.length > 0) initial[v.name] = v.options[0].label;
    return initial;
  });

  // ---- quick order form ----
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", notes: "" });
  const [delivery, setDelivery] = useState<DeliveryValue>(emptyDelivery);
  const [fee, setFee] = useState<number | null>(null);
  const [feeState, setFeeState] = useState<"idle" | "loading" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  // ---- pricing ----
  const unitPrice = useMemo(() => {
    let price = product.price;
    for (const v of product.variants) {
      const chosen = selections[v.name];
      const opt = v.options.find((o) => o.label === chosen);
      if (opt) price += opt.priceModifier;
    }
    return Math.round(price);
  }, [product.price, product.variants, selections]);

  const maxStock = product.trackStock ? product.stock : 0;
  const soldOut = product.trackStock && product.stock <= 0;
  const giftBoxActive = giftBox.enabled && wantGiftBox;
  const lineTotal = unitPrice * quantity + (giftBoxActive ? giftBox.fee * quantity : 0);

  // ---- Meta Pixel: ViewContent ----
  useEffect(() => {
    trackPixel("ViewContent", {
      customData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: product.price,
        currency: "DZD",
      },
    });
  }, [product.id]);

  function buildItem() {
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.media[0]?.url || "",
      unitPrice,
      basePrice: product.price,
      quantity,
      selections: { ...selections },
      giftBox: giftBoxActive,
      maxStock,
    };
  }

  function handleAddToCart() {
    if (soldOut) return;
    addItem(buildItem());
    trackPixel("AddToCart", {
      customData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: unitPrice * quantity,
        currency: "DZD",
        contents: [{ id: product.id, quantity, item_price: unitPrice }],
      },
    });
    toast.success(`${product.name} ✓`);
  }

  function handleBuyNow() {
    if (soldOut) return;
    addItem(buildItem());
    trackPixel("AddToCart", {
      customData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: unitPrice * quantity,
        currency: "DZD",
        contents: [{ id: product.id, quantity, item_price: unitPrice }],
      },
    });
    trackPixel("InitiateCheckout", {
      customData: { value: lineTotal, currency: "DZD", num_items: quantity, content_ids: [product.id] },
    });
    router.push("/checkout");
  }

  function selectGiftBox(checked: boolean) {
    setWantGiftBox(checked);
    if (checked)
      trackPixel("GiftBoxSelected", { customData: { content_name: product.name, value: giftBox.fee, currency: "DZD" } });
  }

  // ---- quick order submit (COD) ----
  async function handleQuickOrder(e: React.FormEvent) {
    e.preventDefault();
    if (soldOut) return;
    if (!isValidDzMobile(form.phone)) {
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
          wilayaId: delivery.wilayaId,
          commune: delivery.commune,
          deliveryType: delivery.deliveryType,
          items: [
            {
              productId: product.id,
              quantity,
              selections,
              giftBox: giftBoxActive,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("errorGeneric"));
        setSubmitting(false);
        return;
      }
      trackPixel("AddPaymentInfo", { customData: { value: lineTotal + (fee ?? 0), currency: "DZD", payment_method: "COD" } });
      router.push(`/order-confirmation/${data.orderNumber}?event=${encodeURIComponent(data.pixelEventId)}`);
    } catch {
      toast.error(t("errorGeneric"));
      setSubmitting(false);
    }
  }

  const media = product.media;
  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-all";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";
  const waHref = whatsappNumber
    ? `https://wa.me/${toInternationalDz(whatsappNumber).replace("+", "")}?text=${encodeURIComponent(`Bonjour / مرحبًا — ${product.name}`)}`
    : "";

  return (
    <div className="pb-24 lg:pb-0">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ============ GALLERY ============ */}
        <div>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-muted aspect-square shadow-luxe-lg">
            {media[activeMedia]?.type === "video" ? (
              <video key={media[activeMedia].url} src={media[activeMedia].url} controls playsInline className="h-full w-full object-cover" />
            ) : media[activeMedia] ? (
              <img key={media[activeMedia].url} src={media[activeMedia].url} alt={media[activeMedia].alt || product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {media.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia(i)}
                  aria-label={`Media ${i + 1}`}
                  className={cn(
                    "relative shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 transition-all",
                    activeMedia === i ? "border-[var(--primary)]" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  {m.type === "video" ? (
                    <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={m.url} alt={m.alt || product.name} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {m.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-bold">▶</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============ DETAILS ============ */}
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)] leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-[var(--primary)]">{formatMoney(unitPrice)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">{formatMoney(product.comparePrice)}</span>
            )}
          </div>

          {product.shortDescription && <p className="mt-4 text-muted-foreground leading-relaxed">{product.shortDescription}</p>}

          {/* Real stock from the dashboard */}
          {product.trackStock && (
            <p className={cn("mt-4 text-sm font-medium", soldOut ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : "text-emerald-600")}>
              {soldOut ? t("soldOut") : product.stock <= 5 ? `${t("lowStock")} ${product.stock} ${t("unitsLeft")}` : `${t("inStock")} (${product.stock})`}
            </p>
          )}

          {/* Variants */}
          {product.variants.map((variant) => (
            <div key={variant.id} className="mt-6">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-semibold text-[var(--primary)]">
                  {variant.name}
                  {variant.required && <span className="text-destructive"> *</span>}
                </p>
                {selections[variant.name] && <p className="text-sm text-muted-foreground">{selections[variant.name]}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => {
                  const active = selections[variant.name] === option.label;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelections((s) => ({ ...s, [variant.name]: option.label }))}
                      aria-pressed={active}
                      className={cn(
                        "relative px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2",
                        active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-input bg-white text-[var(--primary)] hover:border-[var(--primary)]"
                      )}
                    >
                      {option.hexColor && <span className="h-4 w-4 rounded-full border border-black/10 inline-block" style={{ backgroundColor: option.hexColor }} />}
                      {option.label}
                      {option.priceModifier !== 0 && (
                        <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>
                          {option.priceModifier > 0 ? `+${formatMoney(option.priceModifier)}` : `-${formatMoney(Math.abs(option.priceModifier))}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Gift box add-on (optional — gifts are single-piece by default) */}
          {giftBox.enabled && (
            <label
              className={cn(
                "mt-6 flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all",
                giftBoxActive ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-input bg-white hover:border-[var(--primary)]/40"
              )}
            >
              <input type="checkbox" checked={giftBoxActive} onChange={(e) => selectGiftBox(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--gold)]" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Gift className="h-4 w-4 text-[var(--gold)]" />
                  <span className="text-sm font-semibold text-[var(--primary)]">{giftBox.label}</span>
                  <span className="text-sm font-semibold text-[var(--gold)]">+{formatMoney(giftBox.fee)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{giftBox.description}</p>
              </div>
            </label>
          )}

          {/* Quantity + actions */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-input rounded-xl bg-white">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 text-[var(--primary)] hover:bg-muted rounded-s-xl" aria-label="-">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold text-[var(--primary)]" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => (maxStock > 0 ? Math.min(maxStock, q + 1) : Math.min(99, q + 1)))}
                className="p-3 text-[var(--primary)] hover:bg-muted rounded-e-xl"
                aria-label="+"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("total")}: <span className="font-semibold text-[var(--primary)]">{formatMoney(lineTotal)}</span>
            </p>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium py-3.5 rounded-full hover:bg-[var(--primary)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {t("addToCart")}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={soldOut}
              className="inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-white font-medium py-3.5 rounded-full hover:bg-[#b8903a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Banknote className="h-4.5 w-4.5" />
              {t("orderNow")}
            </button>
          </div>

          {/* Trust chips — verifiable only */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Banknote, label: t("codBadge") },
              { icon: Truck, label: t("wilayasBadge") },
              { icon: PackageSearch, label: t("trackBadge") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-muted py-3 px-2">
                <Icon className="h-5 w-5 text-[var(--gold)] mx-auto mb-1.5" />
                <p className="text-xs font-medium text-[var(--primary)] leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Description accordion */}
          <div className="mt-8">
            <Accordion type="multiple" defaultValue={["description"]}>
              {product.description && (
                <AccordionItem value="description">
                  <AccordionTrigger className="text-[var(--primary)] font-semibold">{t("description")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</div>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="delivery">
                <AccordionTrigger className="text-[var(--primary)] font-semibold">{t("deliveryFee")}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      {t("deliveryInfo")}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      {t("codOnlyHint")}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      {t("giftBadgeText")}
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {product.sku && (
            <p className="mt-4 text-xs text-muted-foreground" dir="ltr">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>

      {/* ============ QUICK ORDER (COD) ============ */}
      <section id="quick-order" className="mt-16 scroll-mt-24">
        <div className="rounded-[2rem] border border-border bg-white shadow-luxe p-6 sm:p-10 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--primary)]">{t("quickOrder")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("quickOrderSubtitle")}</p>

          <form onSubmit={handleQuickOrder} className="mt-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="qo-name">
                  {t("yourName")} *
                </label>
                <input id="qo-name" required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="qo-phone">
                  {t("yourPhone")} *
                </label>
                <input
                  id="qo-phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className={cn(inputCls, "tracking-wider")}
                  placeholder="0555 12 34 56"
                  dir="ltr"
                />
              </div>
            </div>

            <DeliverySelector
              value={delivery}
              onChange={setDelivery}
              onFee={(f, s) => {
                setFee(f);
                setFeeState(s);
              }}
            />

            <div>
              <label className={labelCls} htmlFor="qo-address">
                {t("yourAddress")} *
              </label>
              <input
                id="qo-address"
                required
                maxLength={30}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("addressHint")} ({form.address.length}/30)
              </p>
            </div>

            <div>
              <label className={labelCls} htmlFor="qo-notes">
                {t("optionalNote")}
              </label>
              <textarea id="qo-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} />
            </div>

            <div className="rounded-xl bg-muted px-4 py-3.5 text-sm flex items-center justify-between flex-wrap gap-2">
              <span className="text-muted-foreground">{t("orderSummary")}</span>
              <span className="font-semibold text-[var(--primary)]">
                {product.name} × {quantity} — {formatMoney(lineTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || soldOut || fee === null || feeState !== "idle"}
              className="w-full inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-white font-semibold py-4 rounded-full hover:bg-[#b8903a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> {t("orderPlacing")}
                </>
              ) : (
                <>
                  <Banknote className="h-4.5 w-4.5" />
                  {fee !== null ? `${t("confirmOrderBtn")} ${formatMoney(lineTotal + fee)} ${t("onDelivery")}` : t("confirmOrder")}
                </>
              )}
            </button>
            {feeState === "error" && (
              <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2.5">{t("feeError")}</p>
            )}
          </form>
        </div>
      </section>

      {/* ============ REAL REVIEWS (only approved ones) ============ */}
      {reviews.length > 0 ? (
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-6">{t("reviewsTitle")}</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-border p-5 shadow-luxe">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-[var(--primary)]">
                    {r.customerName}
                    <span className="font-normal text-muted-foreground"> — {r.wilayaName}</span>
                  </p>
                  <div className="flex items-center gap-0.5" aria-label={`${r.rating}/5`}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                </div>
                {r.text && <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-12 text-center text-xs text-muted-foreground">{t("noReviews")}</p>
      )}

      {/* ============ STICKY MOBILE ORDER BAR ============ */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-border shadow-[0_-8px_30px_-12px_rgba(10,31,68,0.25)] px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--primary)] truncate">{formatMoney(lineTotal)}</p>
          <p className="text-[11px] text-muted-foreground truncate">{t("codBadge")}</p>
        </div>
        <a
          href="#quick-order"
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--gold)] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#b8903a] transition-colors"
        >
          <Banknote className="h-4.5 w-4.5" />
          {t("orderNow")}
        </a>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="shrink-0 h-11 w-11 rounded-full bg-[#25D366] text-white flex items-center justify-center"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
