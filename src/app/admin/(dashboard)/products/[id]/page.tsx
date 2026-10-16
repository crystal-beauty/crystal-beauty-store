import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductEditor, { type ProductEditorData } from "@/components/admin/product-editor";
import type { MediaItem } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modifier le produit" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { variants: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } },
    }),
    db.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const initial: ProductEditorData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    price: String(product.price),
    comparePrice: product.comparePrice ? String(product.comparePrice) : "",
    costPrice: product.costPrice ? String(product.costPrice) : "",
    weightGrams: String(product.weightGrams),
    stock: String(product.stock),
    trackStock: product.trackStock,
    active: product.active,
    featured: product.featured,
    media: JSON.parse(product.media || "[]") as MediaItem[],
    categoryId: product.categoryId || "",
    variants: product.variants.map((v) => ({
      name: v.name,
      required: v.required,
      options: v.options.map((o) => ({
        label: o.label,
        priceModifier: o.priceModifier,
        hexColor: o.hexColor || "",
        stock: o.stock === null ? "" : String(o.stock),
      })),
    })),
  };

  return <ProductEditor key={product.id} initial={initial} categories={categories} productId={product.id} />;
}
