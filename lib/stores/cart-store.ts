"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────

export interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  slug: string;
  color: string;
  hexcode: string | null;
  size: string;
  price: number; // basePrice + priceModifier
  mrp: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  total: () => number;
  savings: () => number;
}

// ── Store ──────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + item.quantity, i.stock),
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
              : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      total: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      savings: () =>
        get().items.reduce(
          (acc, i) => acc + (i.mrp - i.price) * i.quantity,
          0
        ),
    }),
    {
      name: "lookkool-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
