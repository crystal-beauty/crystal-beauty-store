import { getSession, canDelete } from "@/lib/auth";
import CategoriesManager from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const session = await getSession();
  return <CategoriesManager canDelete={session ? canDelete(session.role, "categories") : false} />;
}
