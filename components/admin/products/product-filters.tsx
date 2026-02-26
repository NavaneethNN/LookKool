"use client";

import { Search, X, Filter } from "lucide-react";

interface Category {
  categoryId: number;
  categoryName: string;
}

interface ProductFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  currentFilters: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    order?: string;
  };
  categories: Category[];
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  currentFilters,
  categories,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
      {/* Search */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit();
            }
          }}
          placeholder="Search by name or code..."
          className="w-full h-10 rounded-lg border border-input bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {searchInput && (
          <button
            onClick={onSearchClear}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Filter */}
        <select
          value={currentFilters.category ?? ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={currentFilters.status ?? ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Active filters indicator */}
        {(currentFilters.search ||
          currentFilters.category ||
          currentFilters.status) && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        {/* Sort */}
        <select
          value={
            currentFilters.sort
              ? `${currentFilters.sort}-${currentFilters.order || "asc"}`
              : ""
          }
          onChange={(e) => onSortChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Sort: Priority</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price: Low - High</option>
          <option value="price-desc">Price: High - Low</option>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="code-asc">Code A-Z</option>
        </select>
      </div>
    </div>
  );
}
