"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface RecentlyViewedState {
  /** Product IDs in reverse-chronological order (most recent first) */
  productIds: number[];
  /** Track a product view — moves it to the front if already tracked */
  trackView: (productId: number) => void;
  /** Clear all history */
  clear: () => void;
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],

      trackView: (productId: number) =>
        set((state) => {
          const filtered = state.productIds.filter((id) => id !== productId);
          return {
            productIds: [productId, ...filtered].slice(0, MAX_ITEMS),
          };
        }),

      clear: () => set({ productIds: [] }),
    }),
    {
      name: "lookkool-recently-viewed",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
