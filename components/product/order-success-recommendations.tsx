"use client";

import { useEffect, useState } from "react";
import { getTrendingProducts, getNewArrivals } from "@/lib/actions/recommendation.actions";
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

export function OrderSuccessRecommendations() {
  const [trending, setTrending] = useState<RecommendedProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<RecommendedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [t, n] = await Promise.all([
          getTrendingProducts(10),
          getNewArrivals(10),
        ]);
        setTrending(t);
        // Deduplicate new arrivals against trending
        const trendingIds = new Set(t.map((p) => p.productId));
        setNewArrivals(n.filter((p) => !trendingIds.has(p.productId)));
      } catch {
        // fail silently
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  if (!loaded) return null;

  return (
    <div className="container mx-auto px-4 pb-16 space-y-2">
      <ProductRecommendationStrip
        title="Trending Now"
        icon={<TrendingUp className="h-5 w-5" />}
        subtitle="Popular picks from our store"
        products={trending}
        layout="scroll"
        variant="accent"
      />
      <ProductRecommendationStrip
        title="New Arrivals"
        icon={<Sparkles className="h-5 w-5" />}
        subtitle="Fresh additions you might love"
        products={newArrivals}
        layout="scroll"
        variant="default"
      />
      <RecentlyViewed title="Continue Browsing" />
    </div>
  );
}
