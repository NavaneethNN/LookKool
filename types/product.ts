// Shared product types used across admin and storefront components

export interface Product {
  productId: number;
  productName: string;
  slug: string;
  description: string | null;
  categoryId: number;
  basePrice: string;
  mrp: string;
  productCode: string;
  material: string | null;
  fabricWeight: string | null;
  careInstructions: string | null;
  origin: string | null;
  detailHtml: string | null;
  label: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductVariant {
  variantId: number;
  productId: number;
  sku: string | null;
  color: string;
  hexcode: string | null;
  size: string;
  stockCount: number;
  priceModifier: string;
  price: string | null;
  mrp: string | null;
  costPrice: string | null;
  barcode: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductImage {
  imageId: number;
  variantId: number;
  imagePath: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

/** Variant with nested images (from Drizzle relations) */
export interface VariantWithImages extends ProductVariant {
  images: ProductImage[];
}

/** Product with category + variants (from admin product detail) */
export interface ProductWithDetails extends Product {
  category: { categoryName: string } | null;
  variants: (ProductVariant & {
    images: ProductImage[];
  })[];
}

/** Product list item (admin list view) */
export interface AdminProductListItem extends Product {
  category: { categoryName: string } | null;
  variants: (Pick<ProductVariant, "variantId" | "color" | "hexcode" | "size" | "stockCount"> & {
    images: Pick<ProductImage, "imagePath">[];
  })[];
}

/** Product search result for billing POS */
export interface BillingSearchProduct {
  productId: number;
  productName: string;
  productCode: string;
  basePrice: string;
  mrp: string;
  variants: Pick<ProductVariant, "variantId" | "color" | "size" | "stockCount" | "sku" | "priceModifier" | "price" | "mrp">[];
}

/** Category type */
export interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: number | null;
  isActive: boolean;
  sortOrder: number;
  parent?: { categoryName: string } | null;
}

/** Lightweight category for dropdowns */
export interface CategoryListItem {
  categoryId: number;
  categoryName: string;
  slug: string;
}

/** Stock summary for a product */
export interface ProductStockSummary {
  variants: Pick<ProductVariant, "variantId" | "color" | "size" | "stockCount" | "sku">[];
  totalStock: number;
  outOfStock: number;
  lowStock: number;
  totalVariants: number;
}
