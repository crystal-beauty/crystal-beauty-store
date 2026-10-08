import { Suspense } from "react";
import CartView from "@/components/store/cart-view";

export const metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartView />
    </Suspense>
  );
}
