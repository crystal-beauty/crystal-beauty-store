"use client";

import Link from "next/link";
import { ShoppingBag, Package } from "lucide-react";
import { useCart } from "@/lib/cart";
import { trackPixel } from "@/lib/pixel";
import { useSettings } from "@/components/store/settings-provider";
import { useT } from "@/components/store/locale-provider";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string;
  stock: number;
  trackStock: boolean;
  hasVariants: boolean;
  shortDescription?: string | null;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const settings = useSettings();
  const addItem = useCart((s) => s.addItem);
  const t = useT();

  const soldOut = product.trackStock && product.stock <= 0;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasVariants) return; // needs option selection → go to product page
    if (soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      basePrice: product.price,
      quantity: 1,
      selections: {},
      giftBox: false,
      maxStock: product.trackStock ? product.stock : 0,
    });
    trackPixel("AddToCart", {
      customData: {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: product.price,
        currency: "DZD",
      },
    });
    toast.success(`${product.name} ✓`);
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-muted aspect-square shadow-luxe ring-1 ring-transparent group-hover:ring-[var(--primary)]/10 transition-[box-shadow,ring] duration-300">
        {product.image ? (
          <img
            src={product.image}
            alt={product.shortDescription ? `${product.name} — ${product.shortDescription}` : product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/25">
            <Package className="h-10 w-10" />
          </div>
        )}

        {soldOut && (
          <span className="absolute top-3 end-3 bg-[var(--primary)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {t("soldOut")}
          </span>
        )}

        {/* Honest low-stock hint — real dashboard stock only */}
        {!soldOut && product.trackStock && product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 end-3 bg-white/95 text-[var(--primary)] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[var(--primary)]/10 shadow-sm">
            {t("lowStock")} {product.stock}
          </span>
        )}

        {/* Quick add */}
        {!soldOut && (
          <button
            onClick={quickAdd}
            aria-label={product.hasVariants ? product.name : `${t("addToCart")} — ${product.name}`}
            className="absolute bottom-3 inset-x-3 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium py-2.5 rounded-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#16305c] max-md:opacity-100 max-md:translate-y-0"
          >
            <ShoppingBag className="h-4 w-4" />
            {product.hasVariants ? t("choose") : t("addToCart")}
          </button>
        )}
      </div>

      <div className="pt-3.5 px-1">
        <h3 className="font-display text-base font-medium text-[var(--primary)] leading-snug group-hover:text-[#2c4a7c] transition-colors">{product.name}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          {/* Old price shown ONLY if the admin set one on this product */}
          <span className="text-[var(--primary)] font-semibold text-[17px] tracking-tight">{formatMoney(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-[13px] text-muted-foreground line-through">{formatMoney(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
