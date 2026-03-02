import {
  getCachedTrending,
  getCachedNewArrivals,
  getCachedTopRated,
  getCachedBiggestDeals,
} from "@/lib/cached-data";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";
import { TrendingUp, Sparkles, Star, Percent } from "lucide-react";

export async function HomeRecommendations() {
  const [trending, newArrivals, topRated, deals] = await Promise.all([
    getCachedTrending(8),
    getCachedNewArrivals(8),
    getCachedTopRated(8),
    getCachedBiggestDeals(8),
  ]);

  // Deduplicate — if trending and new arrivals overlap, filter out dupes
  const trendingIds = new Set(trending.map((p) => p.productId));
  const filteredNew = newArrivals.filter(
    (p) => !trendingIds.has(p.productId)
  );

  const allIds = new Set([
    ...trending.map((p) => p.productId),
    ...filteredNew.map((p) => p.productId),
  ]);
  const filteredTopRated = topRated.filter(
    (p) => !allIds.has(p.productId)
  );

  return (
    <div className="container mx-auto px-4 py-10 sm:py-14 space-y-10 sm:space-y-14">
      {/* Trending Now */}
      {trending.length > 0 && (
        <ProductRecommendationStrip
          title="Trending Now"
          subtitle="Most popular picks this month"
          products={trending}
          icon={<TrendingUp className="h-5 w-5 text-primary/60" />}
          layout="scroll"
          variant="accent"
        />
      )}

      {/* New Arrivals */}
      {filteredNew.length > 0 && (
        <ProductRecommendationStrip
          title="New Arrivals"
          subtitle="Fresh additions to our collection"
          products={filteredNew}
          icon={<Sparkles className="h-5 w-5 text-primary/60" />}
          layout="scroll"
        />
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <ProductRecommendationStrip
          title="Best Deals"
          subtitle="Biggest discounts right now"
          products={deals}
          icon={<Percent className="h-5 w-5 text-primary/60" />}
          layout="scroll"
          variant="muted"
        />
      )}

      {/* Top Rated */}
      {filteredTopRated.length > 0 && (
        <ProductRecommendationStrip
          title="Top Rated"
          subtitle="Loved by our customers"
          products={filteredTopRated}
          icon={<Star className="h-5 w-5 text-primary/60" />}
          layout="scroll"
        />
      )}
    </div>
  );
}
