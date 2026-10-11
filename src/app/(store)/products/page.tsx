import Link from "next/link";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { Search } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";
import ShopFilters from "@/components/store/shop-filters";
import { getLang } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import {
  getLocalizedCategoryName,
  getLocalizedCategoryDesc,
  getLocalizedProductName,
  getLocalizedProductShortDesc,
} from "@/lib/catalog-i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Boutique · Crystal Beauty" };

interface Props {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const [{ category, sort = "newest", q }, lang] = await Promise.all([searchParams, getLang()]);

  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;

  const where = {
    active: true,
    ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    ...(q ? { name: { contains: q } } : {}),
  };

  const orderBy =
    sort === "price-asc" ? { price: "asc" as const }
    : sort === "price-desc" ? { price: "desc" as const }
    : sort === "featured" ? [{ featured: "desc" as const }, { createdAt: "desc" as const }]
    : { createdAt: "desc" as const };

  const products = await db.product.findMany({
    where,
    orderBy,
    include: { variants: { take: 1 }, category: true },
  });

  const cards: ProductCardData[] = products.map((p) => {
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
    };
  });

  const localizedActiveCatName = activeCategory
    ? getLocalizedCategoryName(activeCategory.slug, activeCategory.name, lang)
    : undefined;
  const localizedActiveCatDesc = activeCategory
    ? getLocalizedCategoryDesc(activeCategory.slug, activeCategory.description, lang)
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Heading */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)] mb-2">
          {activeCategory ? t("browse", lang) : t("collectionEyebrow", lang)}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">
          {localizedActiveCatName ? localizedActiveCatName : q ? `${t("resultsFor", lang)} «${q}»` : t("findPerfectGift", lang)}
        </h1>
        {localizedActiveCatDesc && (
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">{localizedActiveCatDesc}</p>
        )}
      </div>

      <Suspense fallback={<div className="h-14" />}>
        <ShopFilters
          categories={categories.map((c) => ({
            slug: c.slug,
            name: getLocalizedCategoryName(c.slug, c.name, lang),
          }))}
          activeCategory={category}
          sort={sort}
          q={q || ""}
          lang={lang}
        />
      </Suspense>

      {/* Grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 mt-8">
          {cards.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-lg font-medium text-[var(--primary)]">{t("noResults", lang)}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("noResultsHint", lang)}</p>
          <Link href="/products" className="mt-6 inline-block text-sm font-medium text-[var(--brand)] hover:underline">
            {t("clearFilters", lang)}
          </Link>
        </div>
      )}
    </div>
  );
}
