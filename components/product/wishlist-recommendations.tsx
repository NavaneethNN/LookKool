"use client";

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import {
  getTrendingProducts,
  getFrequentlyBoughtTogether,
} from "@/lib/actions/recommendation-actions";
import { ProductRecommendationStrip } from "./recommendation-strip";
import { RecentlyViewed } from "./recently-viewed";
import { TrendingUp, Sparkles } from "lucide-react";

type RecommendedProduct = {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  label: string | null;
  image: string;
  rating?: number;
  reviewCount?: number;
};

export function WishlistRecommendations() {
  const { items } = useWishlistStore();
  const [similar, setSimilar] = useState<RecommendedProduct[]>([]);
  const [trending, setTrending] = useState<RecommendedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const wishlistIds = items.map((i) => i.productId);

  useEffect(() => {
    async function load() {
      try {
        const excludeSet = new Set(wishlistIds);

        const [bought, trend] = await Promise.all([
          wishlistIds.length > 0
            ? getFrequentlyBoughtTogether(wishlistIds, 12)
            : Promise.resolve([]),
          getTrendingProducts(10),
        ]);

        // Exclude wishlist items from results
        setSimilar(bought.filter((p) => !excludeSet.has(p.productId)));
        setTrending(
          trend.filter(
            (p) =>
              !excludeSet.has(p.productId) &&
              !bought.some((b) => b.productId === p.productId)
          )
        );
      } catch {
        // fail silently
      } finally {
        setLoaded(true);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds.length]);

  if (!loaded) return null;

  return (
    <div className="mt-10 space-y-2">
      {similar.length > 0 && (
        <ProductRecommendationStrip
          title="You Might Also Like"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Based on your wishlist"
          products={similar}
          layout="scroll"
          variant="muted"
        />
      )}
      <ProductRecommendationStrip
        title="Trending Now"
        icon={<TrendingUp className="h-5 w-5" />}
        products={trending}
        layout="scroll"
        variant="accent"
      />
      <RecentlyViewed excludeIds={wishlistIds} />
    </div>
  );
}
