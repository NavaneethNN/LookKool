"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  PackageOpen,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
}

interface Product {
  productId: number;
  productName: string;
  slug: string;
  basePrice: number;
  mrp: number;
  label: string | null;
  image: string;
}

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

interface ShopContentProps {
  products: Product[];
  categories: Category[];
  currentSort: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentCategory: string;
  currentQuery: string;
  trendingProducts?: RecommendedProduct[];
  storeName?: string;
}

export function ShopContent({
  products,
  categories,
  currentSort,
  currentPage,
  totalPages,
  totalCount,
  currentCategory,
  currentQuery,
  trendingProducts = [],
  storeName = "our store",
}: ShopContentProps) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const merged = {
        sort: currentSort,
        category: currentCategory,
        q: currentQuery,
        page: "1",
        ...overrides,
      };
      if (merged.sort && merged.sort !== "newest")
        params.set("sort", merged.sort);
      if (merged.category) params.set("category", merged.category);
      if (merged.q) params.set("q", merged.q);
      if (merged.page && merged.page !== "1") params.set("page", merged.page);
      const qs = params.toString();
      return `/shop${qs ? `?${qs}` : ""}`;
    },
    [currentSort, currentCategory, currentQuery]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: query.trim() || undefined, page: "1" }));
  }

  function clearFilters() {
    setQuery("");
    router.push("/shop");
  }

  const hasFilters = currentCategory || currentQuery;

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Popular" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
  ];

  return (
    <div>
      {/* Header */}
      <FadeIn direction="up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl tracking-tight">
            Shop All
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            Explore our full collection of products
          </p>
        </div>
      </FadeIn>

      {/* Search Bar */}
      <FadeIn direction="up" delay={0.1}>
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-10 pr-24 rounded-xl border-border/60 focus-visible:ring-primary/20 transition-shadow duration-300 focus-visible:shadow-lg focus-visible:shadow-primary/5"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => {
                    setQuery("");
                    if (currentQuery)
                      router.push(buildUrl({ q: undefined, page: "1" }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="h-8 rounded-lg shadow-sm shadow-primary/20"
              >
                Search
              </Button>
            </div>
          </div>
        </form>
      </FadeIn>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <FadeIn direction="up" delay={0.15}>
          <div className="mb-6 flex flex-wrap gap-2">
            <a
              href={buildUrl({ category: undefined, page: "1" })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                !currentCategory
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:shadow-sm"
              }`}
            >
              All
            </a>
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={buildUrl({ category: cat.slug, page: "1" })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                  currentCategory === cat.slug
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:shadow-sm"
                }`}
              >
                {cat.categoryName}
              </a>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Toolbar */}
      <FadeIn direction="up" delay={0.2}>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCount}</span>{" "}
              {totalCount === 1 ? "product" : "products"}
              {currentCategory
                ? ` in ${
                    categories.find((c) => c.slug === currentCategory)
                      ?.categoryName || currentCategory
                  }`
                : ""}
              {currentQuery ? ` matching "${currentQuery}"` : ""}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground rounded-full"
              >
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sort:</span>
            <div className="flex gap-1">
              {sortOptions.map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ sort: opt.value, page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${
                    currentSort === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Product Grid */}
      {products.length > 0 ? (
        <StaggerChildren
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5"
          staggerDelay={0.05}
        >
          {products.map((product) => (
            <StaggerItem key={product.productId}>
              <ProductCard
                productId={product.productId}
                productName={product.productName}
                slug={product.slug}
                basePrice={product.basePrice}
                mrp={product.mrp}
                image={product.image}
                label={product.label}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>
      ) : (
        <FadeIn direction="up">
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/60 ring-1 ring-border/50">
              <PackageOpen className="h-9 w-9 text-muted-foreground/60" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? "Try adjusting your filters or search query."
                  : "We're adding new products soon. Check back later!"}
              </p>
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-full"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </FadeIn>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <FadeIn direction="up">
          <div className="mt-12 flex items-center justify-center gap-3">
            {currentPage > 1 && (
              <a
                href={buildUrl({ page: String(currentPage - 1) })}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-all duration-300 hover:shadow-sm"
              >
                Previous
              </a>
            )}
            <span className="text-sm text-muted-foreground px-2">
              Page{" "}
              <span className="font-semibold text-foreground">
                {currentPage}
              </span>{" "}
              of {totalPages}
            </span>
            {currentPage < totalPages && (
              <a
                href={buildUrl({ page: String(currentPage + 1) })}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-all duration-300 hover:shadow-sm"
              >
                Next
              </a>
            )}
          </div>
        </FadeIn>
      )}

      {/* Trending */}
      {trendingProducts.length > 0 && (
        <div className="mt-14">
          <ProductRecommendationStrip
            title="Trending Now"
            icon={<TrendingUp className="h-5 w-5 text-primary/60" />}
            subtitle={`Popular picks from ${storeName}`}
            products={trendingProducts}
            layout="scroll"
            variant="accent"
          />
        </div>
      )}

      {/* Recently Viewed */}
      <div className="mt-10">
        <RecentlyViewed excludeIds={products.map((p) => p.productId)} />
      </div>
    </div>
  );
}
