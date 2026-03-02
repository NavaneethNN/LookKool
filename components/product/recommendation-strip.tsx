"use client";

import { useRef, useState, useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import type { RecommendedProduct } from "@/lib/actions/recommendation.actions";

interface ProductRecommendationStripProps {
  title: string;
  subtitle?: string;
  products: RecommendedProduct[];
  layout?: "scroll" | "grid";
  icon?: React.ReactNode;
  gridCols?: 3 | 4 | 5;
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    function checkScroll() {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [products]);

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
      ? "bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8"
      : variant === "accent"
      ? "bg-gradient-to-r from-primary/[0.04] via-primary/[0.06] to-primary/[0.02] rounded-2xl sm:rounded-3xl p-5 sm:p-8 ring-1 ring-primary/[0.06]"
      : "";

  const gridColClass =
    gridCols === 5
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : gridCols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <FadeIn direction="up">
      <section className={bgClass}>
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
              {icon}
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {layout === "scroll" && products.length > 4 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-accent transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm hover:scale-105"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-accent transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm hover:scale-105"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Products */}
        {layout === "scroll" ? (
          <div className="relative">
            {/* Fade edges */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}
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
    </FadeIn>
  );
}
