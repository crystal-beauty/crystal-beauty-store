"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap, Star, Gift, Package, Truck, ShieldCheck, RotateCcw, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { trackPixel } from "@/lib/pixel";
import { useSettings } from "@/components/store/settings-provider";
import { formatMoney } from "@/lib/format";
import type { MediaItem } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VariantData {
  id: string;
  name: string;
  required: boolean;
  options: { id: string; label: string; priceModifier: number; hexColor: string | null; stock: number | null }[];
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
  currencySymbol,
  currencyCode,
}: {
  product: ProductData;
  giftBox: { enabled: boolean; fee: number; label: string; description: string };
  currencySymbol: string;
  currencyCode: string;
}) {
  const router = useRouter();
  const settings = useSettings();
  const addItem = useCart((s) => s.addItem);

  const [activeMedia, setActiveMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wantGiftBox, setWantGiftBox] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of product.variants) if (v.required && v.options.length > 0) initial[v.name] = v.options[0].label;
    return initial;
  });

  // ---- pricing ----
  const unitPrice = useMemo(() => {
    let price = product.price;
    for (const v of product.variants) {
      const chosen = selections[v.name];
      const opt = v.options.find((o) => o.label === chosen);
      if (opt) price += opt.priceModifier;
    }
    return Math.round(price * 100) / 100;
  }, [product.price, product.variants, selections]);

  const maxStock = product.trackStock ? product.stock : 0;
  const soldOut = product.trackStock && product.stock <= 0;
  const giftBoxActive = giftBox.enabled && wantGiftBox;
  const lineTotal = unitPrice * quantity + (giftBoxActive ? giftBox.fee * quantity : 0);

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  // ---- Meta Pixel: ViewContent ----
  useEffect(() => {
    trackPixel("ViewContent", {
      customData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: product.price,
        currency: currencyCode,
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
        currency: currencyCode,
        contents: [{ id: product.id, quantity, item_price: unitPrice }],
      },
    });
    toast.success(`${product.name} added to your cart`);
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
        currency: currencyCode,
        contents: [{ id: product.id, quantity, item_price: unitPrice }],
      },
    });
    trackPixel("InitiateCheckout", {
      customData: { value: lineTotal, currency: currencyCode, num_items: quantity, content_ids: [product.id] },
    });
    router.push("/checkout");
  }

  function selectGiftBox(checked: boolean) {
    setWantGiftBox(checked);
    if (checked) trackPixel("GiftBoxSelected", { customData: { content_name: product.name, value: giftBox.fee, currency: currencyCode } });
  }

  const media = product.media.length > 0 ? product.media : [];

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ============ GALLERY ============ */}
        <div>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-muted aspect-square shadow-luxe-lg">
            {media[activeMedia]?.type === "video" ? (
              <video
                key={media[activeMedia].url}
                src={media[activeMedia].url}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : media[activeMedia] ? (
               
              <img
                key={media[activeMedia].url}
                src={media[activeMedia].url}
                alt={media[activeMedia].alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[var(--gold)] text-white text-sm font-bold px-3 py-1.5 rounded-full">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia(i)}
                  aria-label={`View media ${i + 1}`}
                  className={cn(
                    "relative shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 transition-all",
                    activeMedia === i ? "border-[var(--primary)]" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  {m.type === "video" ? (
                    <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                     
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)] leading-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Loved by gifters worldwide</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-[var(--primary)]">{formatMoney(unitPrice, { currencySymbol })}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">{formatMoney(product.comparePrice, { currencySymbol })}</span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Stock indicator */}
          {product.trackStock && (
            <p className={cn("mt-4 text-sm font-medium", soldOut ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : "text-emerald-600")}>
              {soldOut ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left — order soon` : "In stock, ready to ship"}
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
                {selections[variant.name] && (
                  <p className="text-sm text-muted-foreground">{selections[variant.name]}</p>
                )}
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
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-input bg-white text-[var(--primary)] hover:border-[var(--primary)]"
                      )}
                    >
                      {option.hexColor && (
                        <span
                          className="h-4 w-4 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: option.hexColor }}
                        />
                      )}
                      {option.label}
                      {option.priceModifier !== 0 && (
                        <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>
                          {option.priceModifier > 0 ? `+${formatMoney(option.priceModifier, { currencySymbol })}` : `-${formatMoney(Math.abs(option.priceModifier), { currencySymbol })}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Gift box add-on */}
          {giftBox.enabled && (
            <label
              className={cn(
                "mt-6 flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all",
                giftBoxActive ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-input bg-white hover:border-[var(--primary)]/40"
              )}
            >
              <input
                type="checkbox"
                checked={giftBoxActive}
                onChange={(e) => selectGiftBox(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--gold)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[var(--gold)]" />
                  <span className="text-sm font-semibold text-[var(--primary)]">{giftBox.label}</span>
                  <span className="text-sm font-semibold text-[var(--gold)]">+{formatMoney(giftBox.fee, { currencySymbol })}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{giftBox.description}</p>
              </div>
            </label>
          )}

          {/* Quantity + actions */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-input rounded-xl bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 text-[var(--primary)] hover:bg-muted rounded-l-xl"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold text-[var(--primary)]" aria-live="polite">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => (maxStock > 0 ? Math.min(maxStock, q + 1) : Math.min(99, q + 1)))}
                className="p-3 text-[var(--primary)] hover:bg-muted rounded-r-xl"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-[var(--primary)]">{formatMoney(lineTotal, { currencySymbol })}</span>
            </p>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium py-3.5 rounded-full hover:bg-[var(--primary)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={soldOut}
              className="inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-white font-medium py-3.5 rounded-full hover:bg-[#b8903a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="h-4.5 w-4.5" />
              Buy It Now
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Truck, label: "World Express" },
              { icon: ShieldCheck, label: "Secure Order" },
              { icon: RotateCcw, label: "Easy Support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-muted py-3 px-2">
                <Icon className="h-5 w-5 text-[var(--gold)] mx-auto mb-1.5" />
                <p className="text-xs font-medium text-[var(--primary)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Description accordion */}
          <div className="mt-8">
            <Accordion type="multiple" defaultValue={["description"]}>
              {product.description && (
                <AccordionItem value="description">
                  <AccordionTrigger className="text-[var(--primary)] font-semibold">The Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</div>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="shipping">
                <AccordionTrigger className="text-[var(--primary)] font-semibold">Shipping & Delivery</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      Shipped with World Express — tracked, fast, worldwide.
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      Free delivery on orders over {formatMoney(settings.freeShippingThreshold, { currencySymbol })}.
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--gold)] mt-0.5 shrink-0" />
                      Sold as a single gift piece — add an elegant box at checkout if you want it wrapped.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {product.sku && <p className="mt-4 text-xs text-muted-foreground">SKU: {product.sku}</p>}
        </div>
      </div>
    </div>
  );
}
