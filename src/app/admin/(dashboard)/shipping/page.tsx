import ShippingManager from "@/components/admin/shipping-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Livraison (transporteur)" };

export default function AdminShippingPage() {
  return <ShippingManager />;
}
