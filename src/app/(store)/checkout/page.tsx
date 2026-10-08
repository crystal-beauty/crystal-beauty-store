import CheckoutView from "@/components/store/checkout-view";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Commande" };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return <CheckoutView whatsappNumber={settings.whatsappNumber} />;
}
