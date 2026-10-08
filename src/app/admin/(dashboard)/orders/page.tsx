import { Suspense } from "react";
import OrdersManager from "@/components/admin/orders-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersManager />
    </Suspense>
  );
}
