"use client";

import { useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { submitReview } from "@/lib/actions/review-actions";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: number;
  slug: string;
  isAuthenticated: boolean;
}

export function ReviewForm({ productId, slug, isAuthenticated }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <a href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </a>{" "}
          to leave a review.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-green-50 p-4 text-center">
        <p className="text-sm text-green-800 font-medium">
          Thank you! Your review has been submitted.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("productId", String(productId));
    formData.set("rating", String(rating));
    formData.set("slug", slug);

    const result = await submitReview(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Review submitted!");
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <Separator />
      <h4 className="text-sm font-semibold">Write a Review</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    (hoverRating || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewerName">Your Name</Label>
          <Input
            id="reviewerName"
            name="reviewerName"
            required
            placeholder="Display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewText">Your Review</Label>
          <textarea
            id="reviewText"
            name="reviewText"
            required
            minLength={10}
            rows={3}
            placeholder="Share your experience with this product..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Review
        </Button>
      </form>
    </div>
  );
}
