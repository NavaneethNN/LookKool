"use client";

import { Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReviewForm } from "@/components/product/review-form";

// ── Types ────────────────────────────────────────────────────

interface Review {
  reviewId: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: number;
  slug: string;
  recentReviews: Review[];
}

// ── Component ────────────────────────────────────────────────

export function ReviewSection({
  productId,
  slug,
  recentReviews,
}: ReviewSectionProps) {
  return (
    <>
      {recentReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        <div className="space-y-5">
          {recentReviews.map((review) => (
            <div key={review.reviewId} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5">
                  <Star className="h-3 w-3 fill-green-700 text-green-700" />
                  <span className="text-xs font-semibold text-green-800">
                    {review.rating}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {review.reviewerName}
                </span>
                {review.isVerified && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5"
                  >
                    <Check className="mr-0.5 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {review.reviewText}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <Separator />
            </div>
          ))}
        </div>
      )}

      {/* Review submission form */}
      <ReviewForm productId={productId} slug={slug} />
    </>
  );
}
