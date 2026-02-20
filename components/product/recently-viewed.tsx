"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewedStore } from "@/lib/stores/recently-viewed-store";
import { getProductsByIds } from "@/lib/actions/recommendation-actions";
import { ProductRecommendationStrip } from "./recommendation-strip";
import { Clock } from "lucide-react";
import type { RecommendedProduct } from "@/lib/actions/recommendation-actions";

interface RecentlyViewedProps {
  /** Exclude these product IDs (e.g. the current product page) */
  excludeIds?: number[];
  /** Max products to show */
  limit?: number;
  title?: string;
}

export function RecentlyViewed({
  excludeIds = [],
  limit = 8,
  title = "Recently Viewed",
}: RecentlyViewedProps) {
  const { productIds } = useRecentlyViewedStore();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const filteredIds = productIds
    .filter((id) => !excludeIds.includes(id))
    .slice(0, limit);

  useEffect(() => {
    if (filteredIds.length === 0) {
      setLoaded(true);
      return;
    }

    getProductsByIds(filteredIds).then((result) => {
      setProducts(result);
      setLoaded(true);
    });
    // Only re-fetch when the IDs actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredIds.join(",")]);

  if (!loaded || products.length === 0) return null;

  return (
    <ProductRecommendationStrip
      title={title}
      subtitle="Products you've looked at"
      products={products}
      icon={<Clock className="h-5 w-5 text-muted-foreground" />}
      layout="scroll"
    />
  );
}
