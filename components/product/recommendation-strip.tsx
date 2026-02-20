"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RecommendedProduct } from "@/lib/actions/recommendation-actions";

interface ProductRecommendationStripProps {
  title: string;
  subtitle?: string;
  products: RecommendedProduct[];
  /** "scroll" = horizontal scroll strip, "grid" = responsive grid */
  layout?: "scroll" | "grid";
  /** Optional icon shown before title */
  icon?: React.ReactNode;
  /** Max columns for grid layout */
  gridCols?: 3 | 4 | 5;
  /** Background style */
  variant?: "default" | "muted" | "accent";
}

export function ProductRecommendationStrip({
  title,
  subtitle,
  products,
  layout = "scroll",
  icon,
  gridCols = 4,
  variant = "default",
}: ProductRecommendationStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  const bgClass =
    variant === "muted"
      ? "bg-muted/50 rounded-2xl p-6 sm:p-8"
      : variant === "accent"
      ? "bg-gradient-to-r from-[#470B49]/5 to-purple-50 rounded-2xl p-6 sm:p-8"
      : "";

  const gridColClass =
    gridCols === 5
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : gridCols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <section className={`${bgClass}`}>
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {layout === "scroll" && products.length > 4 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background hover:bg-accent transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-background hover:bg-accent transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Products */}
      {layout === "scroll" ? (
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.productId}
              className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] snap-start"
            >
              <ProductCard
                productId={product.productId}
                productName={product.productName}
                slug={product.slug}
                basePrice={product.basePrice}
                mrp={product.mrp}
                image={product.image}
                label={product.label}
                rating={product.rating}
                reviewCount={product.reviewCount}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-5 ${gridColClass}`}>
          {products.map((product) => (
            <ProductCard
              key={product.productId}
              productId={product.productId}
              productName={product.productName}
              slug={product.slug}
              basePrice={product.basePrice}
              mrp={product.mrp}
              image={product.image}
              label={product.label}
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      )}
    </section>
  );
}
