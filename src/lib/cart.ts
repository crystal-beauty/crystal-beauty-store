"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  key: string; // productId + selections hash
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number; // base price + variant modifiers
  basePrice: number;
  quantity: number;
  selections: Record<string, string>; // { "Size": "Large" }
  giftBox: boolean;
  maxStock: number; // 0 = unlimited / not tracked
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  toggleGiftBox: (key: string) => void;
  clear: () => void;
}

function makeKey(productId: string, selections: Record<string, string>): string {
  const s = Object.keys(selections)
    .sort()
    .map((k) => `${k}:${selections[k]}`)
    .join("|");
  return `${productId}__${s}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = makeKey(item.productId, item.selections);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      quantity: i.maxStock > 0 ? Math.min(i.quantity + item.quantity, i.maxStock) : i.quantity + item.quantity,
                      giftBox: item.giftBox || i.giftBox,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, key }] };
        }),
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.key === key
                ? { ...i, quantity: Math.max(1, i.maxStock > 0 ? Math.min(quantity, i.maxStock) : quantity) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      toggleGiftBox: (key) =>
        set((state) => ({
          items: state.items.map((i) => (i.key === key ? { ...i, giftBox: !i.giftBox } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "crystal-beauty-cart" }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
}
