import { getSession, canDelete } from "@/lib/auth";
import ShippingManager from "@/components/admin/shipping-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipping" };

export default async function AdminShippingPage() {
  const session = await getSession();
  return <ShippingManager canDelete={session ? canDelete(session.role, "shipping") : false} />;
}
