"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X, TrendingUp, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { PackageOpen } from "lucide-react";
import { ProductRecommendationStrip } from "@/components/product/recommendation-strip";

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

interface SearchContentProps {
  initialQuery: string;
  initialCategory: string;
  categories: Category[];
  products: Product[];
  trendingProducts?: RecommendedProduct[];
  popularProducts?: RecommendedProduct[];
}

export function SearchContent({
  initialQuery,
  initialCategory,
  categories,
  products,
  trendingProducts = [],
  popularProducts = [],
}: SearchContentProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/search?${params.toString()}`);
  }

  function handleCategoryFilter(slug: string) {
    const newCat = slug === selectedCategory ? "" : slug;
    setSelectedCategory(newCat);
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (newCat) params.set("category", newCat);
      router.push(`/search?${params.toString()}`);
    }
  }

  function clearSearch() {
    setQuery("");
    setSelectedCategory("");
    router.push("/search");
  }

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for products, brands, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pl-12 pr-24 text-base rounded-full border-2 focus-visible:border-primary focus-visible:ring-0"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 rounded-full px-4"
            >
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => handleCategoryFilter(cat.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {initialQuery ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {products.length} result{products.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-foreground">
              &quot;{initialQuery}&quot;
            </span>
            {initialCategory && (
              <span>
                {" "}
                in{" "}
                <span className="font-semibold text-foreground">
                  {categories.find((c) => c.slug === initialCategory)
                    ?.categoryName ?? initialCategory}
                </span>
              </span>
            )}
          </p>

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
            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <PackageOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No results found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or removing filters.
                  </p>
                </div>
              </div>
              <ProductRecommendationStrip
                title="Trending Now"
                icon={<TrendingUp className="h-5 w-5" />}
                subtitle="Check out what others are buying"
                products={trendingProducts}
                layout="scroll"
                variant="accent"
              />
              <ProductRecommendationStrip
                title="Popular Products"
                icon={<Star className="h-5 w-5" />}
                products={popularProducts}
                layout="scroll"
                variant="muted"
              />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Search LookKool</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find your perfect outfit by searching for products.
              </p>
            </div>
          </div>
          <ProductRecommendationStrip
            title="Trending Now"
            icon={<TrendingUp className="h-5 w-5" />}
            subtitle="Discover what's hot right now"
            products={trendingProducts}
            layout="scroll"
            variant="accent"
          />
          <ProductRecommendationStrip
            title="Popular Products"
            icon={<Star className="h-5 w-5" />}
            products={popularProducts}
            layout="scroll"
            variant="muted"
          />
        </div>
      )}
    </div>
  );
}
