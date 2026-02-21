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

  // Build URL with current filters
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
      if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
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
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Shop All</h1>
        <p className="mt-1 text-muted-foreground">
          Explore our full collection of products
        </p>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-10 pr-20 rounded-lg"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setQuery("");
                  if (currentQuery)
                    router.push(buildUrl({ q: undefined, page: "1" }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" size="sm" className="h-8">
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* ── Category Filter Chips ───────────────────────────── */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href={buildUrl({ category: undefined, page: "1" })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !currentCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            All
          </a>
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={buildUrl({ category: cat.slug, page: "1" })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                currentCategory === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.categoryName}
            </a>
          ))}
        </div>
      )}

      {/* ── Toolbar (count + sort) ──────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "product" : "products"}
            {currentCategory
              ? ` in ${categories.find((c) => c.slug === currentCategory)?.categoryName || currentCategory}`
              : ""}
            {currentQuery ? ` matching "${currentQuery}"` : ""}
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" /> Clear filters
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  currentSort === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product Grid ────────────────────────────────────── */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
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
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <PackageOpen className="h-8 w-8 text-muted-foreground" />
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
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <a
              href={buildUrl({ page: String(currentPage - 1) })}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <a
              href={buildUrl({ page: String(currentPage + 1) })}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}

      {/* ── Trending (when few results) ─────────────────────── */}
      {trendingProducts.length > 0 && (
        <div className="mt-12">
          <ProductRecommendationStrip
            title="Trending Now"
            icon={<TrendingUp className="h-5 w-5" />}
            subtitle={`Popular picks from ${storeName}`}
            products={trendingProducts}
            layout="scroll"
            variant="accent"
          />
        </div>
      )}

      {/* ── Recently Viewed ─────────────────────────────────── */}
      <div className="mt-8">
        <RecentlyViewed excludeIds={products.map((p) => p.productId)} />
      </div>
    </div>
  );
}
