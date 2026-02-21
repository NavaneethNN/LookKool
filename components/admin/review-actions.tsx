"use client";

import { useState } from "react";
import { toggleReviewApproval, deleteReview } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ReviewActions({
  reviewId,
  isApproved,
}: {
  reviewId: number;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleReviewApproval(reviewId, !isApproved);
      toast.success(isApproved ? "Review hidden" : "Review approved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update review");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this review permanently?")) return;
    setLoading(true);
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1 ml-4 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        disabled={loading}
        onClick={handleToggle}
        title={isApproved ? "Hide review" : "Approve review"}
      >
        {isApproved ? (
          <EyeOff className="w-4 h-4 text-gray-500" />
        ) : (
          <Eye className="w-4 h-4 text-green-600" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={loading}
        onClick={handleDelete}
        title="Delete review"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );
}
