"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/lib/stores/recently-viewed-store";

/** Invisible component that tracks a product view in localStorage */
export function TrackProductView({ productId }: { productId: number }) {
  const { trackView } = useRecentlyViewedStore();

  useEffect(() => {
    trackView(productId);
  }, [productId, trackView]);

  return null;
}
