import { Suspense } from "react";
import { db } from "@/lib/db";
import CheckoutView from "@/components/store/checkout-view";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const countries = await db.shippingRate.findMany({
    where: { active: true },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });

  return (
    <Suspense fallback={null}>
      <CheckoutView countries={countries.map((c) => c.country).filter((c) => c && c !== "*")} />
    </Suspense>
  );
}
