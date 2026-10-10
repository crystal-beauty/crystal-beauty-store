import { getSession, canDelete } from "@/lib/auth";
import ProductsManager from "@/components/admin/products-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

export default async function AdminProductsPage() {
  const session = await getSession();
  return <ProductsManager canDelete={session ? canDelete(session.role, "products") : false} />;
}
