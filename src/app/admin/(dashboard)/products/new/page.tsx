import { db } from "@/lib/db";
import ProductEditor from "@/components/admin/product-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <ProductEditor categories={categories} />;
}
