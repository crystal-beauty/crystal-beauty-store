import { getSession, canDelete } from "@/lib/auth";
import PromoManager from "@/components/admin/promo-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Codes" };

export default async function AdminPromoPage() {
  const session = await getSession();
  return <PromoManager canDelete={session ? canDelete(session.role, "promo") : false} />;
}
