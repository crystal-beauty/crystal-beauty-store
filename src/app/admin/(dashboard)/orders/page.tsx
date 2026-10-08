import { getSession, canDelete } from "@/lib/auth";
import OrdersManager from "@/components/admin/orders-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const session = await getSession();
  return <OrdersManager canDelete={session ? canDelete(session.role, "orders") : false} />;
}
