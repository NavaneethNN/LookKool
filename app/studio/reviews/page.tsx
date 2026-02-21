import { getAdminReviews } from "@/lib/actions/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import Link from "next/link";
import { Star } from "lucide-react";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { page?: string; approved?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const approved =
    searchParams.approved === "true"
      ? true
      : searchParams.approved === "false"
      ? false
      : undefined;

  const { reviews, total, totalPages } = await getAdminReviews({
    page,
    approved,
  });

  return (
    <>
      <PageHeader title="Reviews" description={`${total} total reviews`} />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { label: "All", value: undefined },
          { label: "Approved", value: "true" },
          { label: "Hidden", value: "false" },
        ].map((f) => (
          <Link
            key={f.label}
            href={`/studio/reviews${f.value ? `?approved=${f.value}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (f.value === undefined && approved === undefined) ||
              f.value === searchParams.approved
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.reviewId}
            className={`rounded-xl border bg-white shadow-sm p-6 ${
              !review.isApproved ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {review.reviewerName}
                  </span>
                  {review.isVerified && (
                    <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                      Verified Purchase
                    </span>
                  )}
                  {!review.isApproved && (
                    <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {review.reviewText}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    Product:{" "}
                    <Link
                      href={`/studio/products/${review.product?.productId}`}
                      className="text-primary hover:underline"
                    >
                      {review.product?.productName ?? "—"}
                    </Link>
                  </span>
                  <span>
                    By: {review.user?.email ?? "Anonymous"}
                  </span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
              </div>
              <ReviewActions
                reviewId={review.reviewId}
                isApproved={review.isApproved}
              />
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="rounded-xl border bg-white shadow-sm p-12 text-center text-sm text-gray-400">
            No reviews found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/studio/reviews?page=${page - 1}${approved !== undefined ? `&approved=${approved}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/studio/reviews?page=${page + 1}${approved !== undefined ? `&approved=${approved}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
