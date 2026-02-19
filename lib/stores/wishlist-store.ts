"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────

export interface WishlistItem {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  image: string;
  label: string | null;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: number) => void;
  toggleItem: (item: WishlistItem) => void;
  isWishlisted: (productId: number) => boolean;
  clearWishlist: () => void;
}

// ── Store ──────────────────────────────────────────────────────

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      toggleItem: (item) => {
        const exists = get().items.some(
          (i) => i.productId === item.productId
        );
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      isWishlisted: (productId) =>
        get().items.some((i) => i.productId === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "lookkool-wishlist",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
