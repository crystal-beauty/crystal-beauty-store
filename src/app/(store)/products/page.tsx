import Link from "next/link";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { Search } from "lucide-react";
import ProductCard, { type ProductCardData } from "@/components/store/product-card";
import ShopFilters from "@/components/store/shop-filters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop All Gifts" };

interface Props {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, sort = "newest", q } = await searchParams;

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
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: Array.isArray(media) && media[0]?.url ? media[0].url : "",
      stock: p.stock,
      trackStock: p.trackStock,
      hasVariants: p.variants.length > 0,
      shortDescription: p.shortDescription,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Heading */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)] mb-2">
          {activeCategory ? "Collection" : "The Full Collection"}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--primary)]">
          {activeCategory ? activeCategory.name : q ? `Results for “${q}”` : "Find the Perfect Gift"}
        </h1>
        {activeCategory?.description && (
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">{activeCategory.description}</p>
        )}
      </div>

      <Suspense fallback={<div className="h-14" />}>
        <ShopFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} activeCategory={category} sort={sort} q={q || ""} />
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
          <p className="text-lg font-medium text-[var(--primary)]">No gifts found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different collection or search term.</p>
          <Link href="/products" className="mt-6 inline-block text-sm font-medium text-[var(--gold)] hover:underline">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
