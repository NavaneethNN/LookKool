"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import {
  getFrequentlyBoughtTogether,
  getTrendingProducts,
} from "@/lib/actions/recommendation-actions";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ShoppingBag, TrendingUp } from "lucide-react";
import type { RecommendedProduct } from "@/lib/actions/recommendation-actions";

export function CartRecommendations() {
  const { items } = useCartStore();
  const [boughtTogether, setBoughtTogether] = useState<RecommendedProduct[]>(
    []
  );
  const [trending, setTrending] = useState<RecommendedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const cartProductIds = items.map((i) => i.productId);
  const cartProductIdKey = cartProductIds.sort().join(",");

  useEffect(() => {
    async function load() {
      const cartIds = cartProductIdKey
        .split(",")
        .filter(Boolean)
        .map(Number);

      const [fbt, trend] = await Promise.all([
        cartIds.length > 0
          ? getFrequentlyBoughtTogether(cartIds, 8)
          : Promise.resolve([]),
        getTrendingProducts(8),
      ]);

      // Exclude products already in cart
      const cartSet = new Set(cartIds);
      setBoughtTogether(fbt.filter((p) => !cartSet.has(p.productId)));
      setTrending(
        trend.filter(
          (p) =>
            !cartSet.has(p.productId) &&
            !fbt.some((f) => f.productId === p.productId)
        )
      );
      setLoaded(true);
    }

    load();
  }, [cartProductIdKey]);

  if (!loaded) return null;

  // If cart is empty, show nothing (empty cart has its own CTA)
  if (items.length === 0) return null;

  return (
    <div className="mt-12 space-y-10">
      {boughtTogether.length > 0 && (
        <ProductRecommendationStrip
          title="Frequently Bought Together"
          subtitle="Customers who bought these also added"
          products={boughtTogether}
          icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />}
          layout="scroll"
          variant="muted"
        />
      )}

      {trending.length > 0 && (
        <ProductRecommendationStrip
          title="You Might Also Like"
          subtitle="Popular picks from our store"
          products={trending}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          layout="scroll"
        />
      )}

      <RecentlyViewed
        excludeIds={items.map((i) => i.productId)}
        title="Recently Viewed"
      />
    </div>
  );
}
