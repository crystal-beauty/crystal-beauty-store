import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
import ProductDetail from "@/components/store/product-detail";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";
import {
  getLocalizedCategoryName,
  getLocalizedProductName,
  getLocalizedProductDesc,
  getLocalizedProductShortDesc,
  getLocalizedVariantName,
  getLocalizedVariantOptionLabel,
} from "@/lib/catalog-i18n";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [product, lang] = await Promise.all([
    db.product.findUnique({ where: { slug } }),
    getLang(),
  ]);
  if (!product) return { title: "404" };
  const name = getLocalizedProductName(product.slug, product.name, lang);
  const desc =
    getLocalizedProductShortDesc(product.slug, product.shortDescription, lang) ||
    getLocalizedProductDesc(product.slug, product.description, lang)?.slice(0, 150) ||
    undefined;
  return {
    title: name,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      variants: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });

  if (!product || !product.active) notFound();

  const [related, reviews] = await Promise.all([
    product.categoryId
      ? db.product.findMany({
          where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
          include: { variants: { take: 1 }, category: true },
          take: 4,
        })
      : Promise.resolve([]),
    // REAL reviews only: submitted + admin-approved, from delivered orders of this product
    db.review.findMany({
      where: { productId: product.id, approved: true, submitted: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { order: { select: { status: true } } },
    }),
  ]);

  // Only show reviews whose order is actually DELIVERED
  const visibleReviews = reviews
    .filter((r) => r.order.status === "DELIVERED")
    .map((r) => ({
      id: r.id,
      customerName: r.customerName,
      wilayaName: r.wilayaName,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    }));

  const relatedCards: ProductCardData[] = related.map((p) => {
    const media = JSON.parse(p.media || "[]");
    return {
      id: p.id,
      name: getLocalizedProductName(p.slug, p.name, lang),
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: Array.isArray(media) && media[0]?.url ? media[0].url : "",
      stock: p.stock,
      trackStock: p.trackStock,
      hasVariants: p.variants.length > 0,
      shortDescription: getLocalizedProductShortDesc(p.slug, p.shortDescription, lang),
      categoryName: p.category ? getLocalizedCategoryName(p.category.slug, p.category.name, lang) : null,
    };
  });

  const localizedName = getLocalizedProductName(product.slug, product.name, lang);
  const localizedDesc = getLocalizedProductDesc(product.slug, product.description, lang);
  const localizedShortDesc = getLocalizedProductShortDesc(product.slug, product.shortDescription, lang);
  const localizedCategoryName = product.category
    ? getLocalizedCategoryName(product.category.slug, product.category.name, lang)
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap">
        <Link href="/" className="hover:text-[var(--primary)]">
          {t("home", lang)}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link href="/products" className="hover:text-[var(--primary)]">
          {t("shopAll", lang)}
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-[var(--primary)]">
              {localizedCategoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-[var(--primary)] font-medium">{localizedName}</span>
      </nav>

      <ProductDetail
        product={{
          id: product.id,
          name: localizedName,
          slug: product.slug,
          sku: product.sku,
          price: product.price,
          comparePrice: product.comparePrice,
          stock: product.stock,
          trackStock: product.trackStock,
          shortDescription: localizedShortDesc,
          description: localizedDesc,
          media: JSON.parse(product.media || "[]"),
          categoryName: localizedCategoryName,
          categorySlug: product.category?.slug,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: getLocalizedVariantName(v.name, lang),
            required: v.required,
            options: v.options.map((o) => ({
              id: o.id,
              label: getLocalizedVariantOptionLabel(o.label, lang),
              priceModifier: o.priceModifier,
              hexColor: o.hexColor,
              stock: o.stock,
            })),
          })),
        }}
        giftBox={{
          enabled: settings.giftBoxEnabled,
          fee: settings.giftBoxFee,
          label: lang === "ar" ? settings.giftBoxLabelAr || settings.giftBoxLabel : settings.giftBoxLabel,
          labelAr: settings.giftBoxLabelAr,
          description: lang === "ar" ? settings.giftBoxDescriptionAr || settings.giftBoxDescription : settings.giftBoxDescription,
          descriptionAr: settings.giftBoxDescriptionAr,
        }}
        reviews={visibleReviews}
        whatsappNumber={settings.whatsappNumber}
      />

      {relatedCards.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--primary)] mb-8">{t("related", lang)}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
            {relatedCards.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
